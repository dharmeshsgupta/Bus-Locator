from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, or_, and_
from pydantic import BaseModel
from typing import Optional, List
import uuid
from datetime import datetime
import logging
import razorpay

from app.core.database import get_db
from app.api.dependencies import get_current_user, get_current_admin, get_current_student
from app.models.user import User
from app.models.student import Student
from app.models.student_fee import StudentFee
from app.models.enums import UserRole
from app.models.payment import Payment, PaymentStatus
from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize Razorpay Client
razorpay_client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

router = APIRouter(prefix="/payment", tags=["Payments and Fees"])

# --- Schemas ---

class GlobalFeeUpdate(BaseModel):
    installment_1_amount: float
    installment_1_deadline: str
    installment_2_amount: float
    installment_2_deadline: str

class StudentFeeUpdate(BaseModel):
    installment_1_amount: float
    installment_1_deadline: Optional[str] = None
    installment_1_status: str
    installment_1_payment_date: Optional[str] = None
    
    installment_2_amount: float
    installment_2_deadline: Optional[str] = None
    installment_2_status: str
    installment_2_payment_date: Optional[str] = None

class InstallmentDetails(BaseModel):
    amount: float
    deadline: Optional[str] = None
    status: str
    payment_date: Optional[str] = None

class StudentFeeResponse(BaseModel):
    student_name: str
    enrollment_no: str
    total_fee: float
    total_paid: float
    remaining_amount: float
    installment_1: InstallmentDetails
    installment_2: InstallmentDetails

class AdminStudentFeeResponse(BaseModel):
    student_id: str
    user_id: str
    enrollment_no: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    route_id: Optional[str] = None
    
    installment_1_amount: float
    installment_1_deadline: Optional[str] = None
    installment_1_status: str
    installment_1_payment_date: Optional[str] = None
    installment_1_gateway: Optional[str] = None
    installment_1_transaction_id: Optional[str] = None
    installment_1_paid_at: Optional[str] = None
    
    installment_2_amount: float
    installment_2_deadline: Optional[str] = None
    installment_2_status: str
    installment_2_payment_date: Optional[str] = None
    installment_2_gateway: Optional[str] = None
    installment_2_transaction_id: Optional[str] = None
    installment_2_paid_at: Optional[str] = None
    
    total_paid: float
    remaining_amount: float

class PaginatedAdminStudentFeeResponse(BaseModel):
    items: List[AdminStudentFeeResponse]
    total: int
    page: int
    page_size: int

class PayInstallmentRequest(BaseModel):
    installment: int # 1 or 2

class CreateOrderRequest(BaseModel):
    installment_number: int # 1 or 2

class CreateOrderResponse(BaseModel):
    razorpay_order_id: str
    amount: int # in paise
    currency: str
    key_id: str

class PaymentHistoryResponse(BaseModel):
    id: str
    installment_number: int
    gateway: str
    amount: float
    receipt_no: Optional[str] = None
    status: str
    created_at: datetime
    paid_at: Optional[datetime] = None

# --- Helpers ---


def determine_status(status: str, deadline: Optional[str]) -> str:
    if status == "paid":
        return "paid"
    if deadline:
        current_date = datetime.now().strftime("%Y-%m-%d")
        if deadline < current_date:
            return "overdue"
    return status

# --- Endpoints ---

@router.get("/admin/fees", response_model=PaginatedAdminStudentFeeResponse)
async def get_all_student_fees(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    current_date = datetime.now().strftime("%Y-%m-%d")
    
    # Base query
    stmt = select(User).join(Student, User.id == Student.user_id).outerjoin(StudentFee, Student.id == StudentFee.student_id)
    count_stmt = select(func.count(User.id)).join(Student, User.id == Student.user_id).outerjoin(StudentFee, Student.id == StudentFee.student_id)
    
    # Apply search filter
    if search:
        search_filter = or_(
            User.name.ilike(f"%{search}%"),
            Student.enrollment_no.ilike(f"%{search}%")
        )
        stmt = stmt.where(search_filter)
        count_stmt = count_stmt.where(search_filter)
        
    # Apply status filter (pending, paid, overdue)
    if status_filter:
        if status_filter == "paid":
            # Both installments paid
            paid_filter = and_(
                StudentFee.id.is_not(None),
                StudentFee.installment_1_status == "paid",
                StudentFee.installment_2_status == "paid"
            )
            stmt = stmt.where(paid_filter)
            count_stmt = count_stmt.where(paid_filter)
        elif status_filter == "overdue":
            # Either installment overdue (unpaid and past deadline)
            overdue_filter = and_(
                StudentFee.id.is_not(None),
                or_(
                    and_(StudentFee.installment_1_status != "paid", StudentFee.installment_1_deadline < current_date),
                    and_(StudentFee.installment_2_status != "paid", StudentFee.installment_2_deadline < current_date)
                )
            )
            stmt = stmt.where(overdue_filter)
            count_stmt = count_stmt.where(overdue_filter)
        elif status_filter == "pending":
            # Either installment pending (unpaid but not overdue, OR no fee record exists)
            pending_filter = or_(
                StudentFee.id.is_(None),
                and_(
                    StudentFee.installment_1_status == "pending",
                    or_(StudentFee.installment_1_deadline.is_(None), StudentFee.installment_1_deadline >= current_date)
                ),
                and_(
                    StudentFee.installment_2_status == "pending",
                    or_(StudentFee.installment_2_deadline.is_(None), StudentFee.installment_2_deadline >= current_date)
                )
            )
            stmt = stmt.where(pending_filter)
            count_stmt = count_stmt.where(pending_filter)

    # Order by user name
    stmt = stmt.order_by(User.name)
    
    # Get total count
    total = await db.scalar(count_stmt)
    
    # Paginate
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    users = result.scalars().all()
    
    response_items = []
    for user in users:
        student = user.student
        if student:
            fee = student.fee_details
            
            inst1_status = "pending"
            inst1_amount = 0.0
            inst1_deadline = ""
            inst1_pay_date = None
            
            inst2_status = "pending"
            inst2_amount = 0.0
            inst2_deadline = ""
            inst2_pay_date = None
            
            if fee:
                inst1_amount = fee.installment_1_amount
                inst1_deadline = fee.installment_1_deadline
                inst1_status = determine_status(fee.installment_1_status, fee.installment_1_deadline)
                inst1_pay_date = fee.installment_1_payment_date
                
                inst2_amount = fee.installment_2_amount
                inst2_deadline = fee.installment_2_deadline
                inst2_status = determine_status(fee.installment_2_status, fee.installment_2_deadline)
                inst2_pay_date = fee.installment_2_payment_date
                
            total_paid = 0.0
            if inst1_status == "paid":
                total_paid += inst1_amount
            if inst2_status == "paid":
                total_paid += inst2_amount
                
            total_fee = inst1_amount + inst2_amount
            remaining_amount = total_fee - total_paid
            
            # Fetch successful payments for this student
            stmt_payments = select(Payment).where(
                Payment.student_id == student.id,
                Payment.status == "SUCCESS"
            )
            res_payments = await db.execute(stmt_payments)
            payments_list = res_payments.scalars().all()
            
            p1 = next((p for p in payments_list if p.installment_number == 1), None)
            p2 = next((p for p in payments_list if p.installment_number == 2), None)
            
            inst1_gateway = p1.gateway if p1 else None
            inst1_transaction_id = p1.razorpay_payment_id if p1 else None
            inst1_paid_at = p1.paid_at.strftime("%Y-%m-%d %H:%M:%S") if (p1 and p1.paid_at) else None
            
            inst2_gateway = p2.gateway if p2 else None
            inst2_transaction_id = p2.razorpay_payment_id if p2 else None
            inst2_paid_at = p2.paid_at.strftime("%Y-%m-%d %H:%M:%S") if (p2 and p2.paid_at) else None
            
            response_items.append(
                AdminStudentFeeResponse(
                    student_id=str(student.id),
                    user_id=str(user.id),
                    enrollment_no=student.enrollment_no,
                    name=user.name,
                    email=user.email,
                    phone=user.phone,
                    route_id=student.route_id,
                    installment_1_amount=inst1_amount,
                    installment_1_deadline=inst1_deadline,
                    installment_1_status=inst1_status,
                    installment_1_payment_date=inst1_pay_date,
                    installment_1_gateway=inst1_gateway,
                    installment_1_transaction_id=inst1_transaction_id,
                    installment_1_paid_at=inst1_paid_at,
                    installment_2_amount=inst2_amount,
                    installment_2_deadline=inst2_deadline,
                    installment_2_status=inst2_status,
                    installment_2_payment_date=inst2_pay_date,
                    installment_2_gateway=inst2_gateway,
                    installment_2_transaction_id=inst2_transaction_id,
                    installment_2_paid_at=inst2_paid_at,
                    total_paid=total_paid,
                    remaining_amount=remaining_amount
                )
            )

            
    return PaginatedAdminStudentFeeResponse(
        items=response_items,
        total=total,
        page=page,
        page_size=page_size
    )

@router.post("/admin/fees/global", status_code=status.HTTP_200_OK)
async def update_global_fees(
    data: GlobalFeeUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    # Fetch all students
    stmt = select(Student)
    result = await db.execute(stmt)
    students = result.scalars().all()
    
    for student in students:
        fee = student.fee_details
        if fee:
            # Apply default values only if they don't already have customized/paid fee records
            # Or if it's currently pending/not customized yet. 
            # In our case, we only update unpaid installments.
            if fee.installment_1_status != "paid":
                fee.installment_1_amount = data.installment_1_amount
                fee.installment_1_deadline = data.installment_1_deadline
            if fee.installment_2_status != "paid":
                fee.installment_2_amount = data.installment_2_amount
                fee.installment_2_deadline = data.installment_2_deadline
        else:
            new_fee = StudentFee(
                student_id=student.id,
                installment_1_amount=data.installment_1_amount,
                installment_1_deadline=data.installment_1_deadline,
                installment_1_status="pending",
                installment_2_amount=data.installment_2_amount,
                installment_2_deadline=data.installment_2_deadline,
                installment_2_status="pending"
            )
            db.add(new_fee)
            
    await db.commit()
    return {"message": f"Global fee structures applied successfully to students."}

@router.put("/admin/fees/student/{student_id}", response_model=AdminStudentFeeResponse)
async def update_student_fee(
    student_id: uuid.UUID,
    data: StudentFeeUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    stmt = select(Student).where(Student.id == student_id)
    result = await db.execute(stmt)
    student = result.scalars().first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found")
        
    fee = student.fee_details
    if not fee:
        fee = StudentFee(student_id=student.id)
        db.add(fee)
        
    # Check if there is a successful online payment for installment 1
    stmt_pay1 = select(Payment).where(
        Payment.student_id == student.id,
        Payment.installment_number == 1,
        Payment.status == "SUCCESS"
    )
    res_pay1 = await db.execute(stmt_pay1)
    pay1_success = res_pay1.scalars().first()

    # Check if there is a successful online payment for installment 2
    stmt_pay2 = select(Payment).where(
        Payment.student_id == student.id,
        Payment.installment_number == 2,
        Payment.status == "SUCCESS"
    )
    res_pay2 = await db.execute(stmt_pay2)
    pay2_success = res_pay2.scalars().first()

    if pay1_success:
        if data.installment_1_amount != fee.installment_1_amount or data.installment_1_status != fee.installment_1_status:
            raise HTTPException(
                status_code=400,
                detail="Cannot modify installment 1 details because there is a successful online payment."
            )
    if pay2_success:
        if data.installment_2_amount != fee.installment_2_amount or data.installment_2_status != fee.installment_2_status:
            raise HTTPException(
                status_code=400,
                detail="Cannot modify installment 2 details because there is a successful online payment."
            )

    fee.installment_1_amount = data.installment_1_amount
    fee.installment_1_deadline = data.installment_1_deadline
    fee.installment_1_status = data.installment_1_status
    fee.installment_1_payment_date = data.installment_1_payment_date
    
    fee.installment_2_amount = data.installment_2_amount
    fee.installment_2_deadline = data.installment_2_deadline
    fee.installment_2_status = data.installment_2_status
    fee.installment_2_payment_date = data.installment_2_payment_date
    
    await db.commit()
    
    # Query associated user
    stmt_user = select(User).where(User.id == student.user_id)
    res_user = await db.execute(stmt_user)
    user = res_user.scalars().first()
    
    inst1_status = determine_status(fee.installment_1_status, fee.installment_1_deadline)
    inst2_status = determine_status(fee.installment_2_status, fee.installment_2_deadline)
    
    total_paid = 0.0
    if inst1_status == "paid":
        total_paid += fee.installment_1_amount
    if inst2_status == "paid":
        total_paid += fee.installment_2_amount
        
    total_fee = fee.installment_1_amount + fee.installment_2_amount
    remaining_amount = total_fee - total_paid
    
    inst1_gateway = pay1_success.gateway if pay1_success else None
    inst1_transaction_id = pay1_success.razorpay_payment_id if pay1_success else None
    inst1_paid_at = pay1_success.paid_at.strftime("%Y-%m-%d %H:%M:%S") if (pay1_success and pay1_success.paid_at) else None
    
    inst2_gateway = pay2_success.gateway if pay2_success else None
    inst2_transaction_id = pay2_success.razorpay_payment_id if pay2_success else None
    inst2_paid_at = pay2_success.paid_at.strftime("%Y-%m-%d %H:%M:%S") if (pay2_success and pay2_success.paid_at) else None

    return AdminStudentFeeResponse(
        student_id=str(student.id),
        user_id=str(user.id),
        enrollment_no=student.enrollment_no,
        name=user.name,
        email=user.email,
        phone=user.phone,
        route_id=student.route_id,
        installment_1_amount=fee.installment_1_amount,
        installment_1_deadline=fee.installment_1_deadline,
        installment_1_status=inst1_status,
        installment_1_payment_date=fee.installment_1_payment_date,
        installment_1_gateway=inst1_gateway,
        installment_1_transaction_id=inst1_transaction_id,
        installment_1_paid_at=inst1_paid_at,
        installment_2_amount=fee.installment_2_amount,
        installment_2_deadline=fee.installment_2_deadline,
        installment_2_status=inst2_status,
        installment_2_payment_date=fee.installment_2_payment_date,
        installment_2_gateway=inst2_gateway,
        installment_2_transaction_id=inst2_transaction_id,
        installment_2_paid_at=inst2_paid_at,
        total_paid=total_paid,
        remaining_amount=remaining_amount
    )


@router.get("/student/fees", response_model=StudentFeeResponse)
async def get_my_fees(
    db: AsyncSession = Depends(get_db),
    current_student: User = Depends(get_current_student)
):
    student = current_student.student
    if not student:
        raise HTTPException(status_code=400, detail="Student profile not found for user")
        
    fee = student.fee_details
    
    inst1_amount = 0.0
    inst1_deadline = ""
    inst1_status = "pending"
    inst1_pay_date = None
    
    inst2_amount = 0.0
    inst2_deadline = ""
    inst2_status = "pending"
    inst2_pay_date = None
    
    if fee:
        inst1_amount = fee.installment_1_amount
        inst1_deadline = fee.installment_1_deadline
        inst1_status = determine_status(fee.installment_1_status, fee.installment_1_deadline)
        inst1_pay_date = fee.installment_1_payment_date
        
        inst2_amount = fee.installment_2_amount
        inst2_deadline = fee.installment_2_deadline
        inst2_status = determine_status(fee.installment_2_status, fee.installment_2_deadline)
        inst2_pay_date = fee.installment_2_payment_date
        
    total_paid = 0.0
    if inst1_status == "paid":
        total_paid += inst1_amount
    if inst2_status == "paid":
        total_paid += inst2_amount
        
    total_fee = inst1_amount + inst2_amount
    remaining_amount = total_fee - total_paid
    
    return StudentFeeResponse(
        student_name=current_student.name,
        enrollment_no=student.enrollment_no,
        total_fee=total_fee,
        total_paid=total_paid,
        remaining_amount=remaining_amount,
        installment_1=InstallmentDetails(
            amount=inst1_amount,
            deadline=inst1_deadline,
            status=inst1_status,
            payment_date=inst1_pay_date
        ),
        installment_2=InstallmentDetails(
            amount=inst2_amount,
            deadline=inst2_deadline,
            status=inst2_status,
            payment_date=inst2_pay_date
        )
    )

@router.post("/create-order", response_model=CreateOrderResponse)
async def create_payment_order(
    data: CreateOrderRequest,
    db: AsyncSession = Depends(get_db),
    current_student: User = Depends(get_current_student)
):
    student = current_student.student
    if not student:
        raise HTTPException(status_code=400, detail="Student profile not found for user")
        
    fee = student.fee_details
    if not fee:
        raise HTTPException(status_code=400, detail="No fee details configured for this student")
        
    installment_number = data.installment_number
    if installment_number == 1:
        if fee.installment_1_status == "paid":
            raise HTTPException(status_code=400, detail="Installment 1 is already paid")
        amount = fee.installment_1_amount
    elif installment_number == 2:
        if fee.installment_2_status == "paid":
            raise HTTPException(status_code=400, detail="Installment 2 is already paid")
        amount = fee.installment_2_amount
    else:
        raise HTTPException(status_code=400, detail="Invalid installment number. Must be 1 or 2.")
        
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Installment amount must be greater than 0")
        
    # Generate receipt number
    receipt_no = f"REC-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    
    # Create Razorpay order
    try:
        order_data = {
            "amount": int(amount * 100), # in paise
            "currency": "INR",
            "receipt": receipt_no,
        }
        if settings.RAZORPAY_KEY_ID == "rzp_test_placeholder":
            logger.warning("Using mock Razorpay order creation because RAZORPAY_KEY_ID is placeholder.")
            razorpay_order = {
                "id": f"order_{uuid.uuid4().hex[:14]}",
                "amount": int(amount * 100),
                "currency": "INR"
            }
        else:
            razorpay_order = razorpay_client.order.create(data=order_data)
    except Exception as e:
        logger.error(f"Error creating Razorpay order: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Razorpay order creation failed: {str(e)}"
        )
        
    # Store payment record in database as CREATED
    payment = Payment(
        student_id=student.id,
        fee_id=fee.id,
        installment_number=installment_number,
        razorpay_order_id=razorpay_order["id"],
        amount=amount,
        currency="INR",
        status="CREATED",
        gateway="RAZORPAY",
        receipt_no=receipt_no
    )
    db.add(payment)
    await db.commit()
    
    return CreateOrderResponse(
        razorpay_order_id=razorpay_order["id"],
        amount=int(amount * 100),
        currency="INR",
        key_id=settings.RAZORPAY_KEY_ID
    )

@router.post("/webhook", status_code=status.HTTP_200_OK)
async def payment_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    body_bytes = await request.body()
    signature = request.headers.get("X-Razorpay-Signature")
    
    # 1. Verify Razorpay signature
    if settings.RAZORPAY_WEBHOOK_SECRET == "placeholder_webhook_secret":
        logger.warning("Bypassing webhook signature verification because RAZORPAY_WEBHOOK_SECRET is placeholder.")
    else:
        if not signature:
            logger.error("Missing X-Razorpay-Signature header")
            raise HTTPException(status_code=400, detail="Missing signature header")
        try:
            razorpay_client.utility.verify_webhook_signature(
                body_bytes.decode("utf-8"),
                signature,
                settings.RAZORPAY_WEBHOOK_SECRET
            )
        except Exception as e:
            logger.error(f"Webhook signature verification failed: {e}")
            raise HTTPException(status_code=400, detail="Invalid signature")
            
    # 2. Parse event payload
    try:
        payload = await request.json()
    except Exception as e:
        logger.error(f"Failed to parse webhook JSON body: {e}")
        raise HTTPException(status_code=400, detail="Invalid JSON body")
        
    event = payload.get("event")
    logger.info(f"Received webhook event: {event}")
    
    # We are interested in success (order.paid, payment.captured) and failure (payment.failed)
    # Extract order_id & payment_id
    razorpay_order_id = None
    razorpay_payment_id = None
    
    event_payload = payload.get("payload", {})
    
    if "payment" in event_payload:
        payment_entity = event_payload["payment"].get("entity", {})
        razorpay_payment_id = payment_entity.get("id")
        razorpay_order_id = payment_entity.get("order_id")
    
    if not razorpay_order_id and "order" in event_payload:
        order_entity = event_payload["order"].get("entity", {})
        razorpay_order_id = order_entity.get("id")
        
    if not razorpay_order_id:
        logger.warning("Webhook received without a valid Razorpay order ID in payload.")
        return {"status": "ignored", "reason": "No order_id found"}
        
    # 3. Lock and update Payment & StudentFee tables atomically
    stmt = select(Payment).where(Payment.razorpay_order_id == razorpay_order_id).with_for_update()
    result = await db.execute(stmt)
    payment_rec = result.scalars().first()
    
    if not payment_rec:
        logger.warning(f"Payment record not found for Razorpay order ID: {razorpay_order_id}")
        return {"status": "ignored", "reason": "Payment record not found"}
        
    # Idempotency check: if status is already SUCCESS, we don't process again
    if payment_rec.status == "SUCCESS":
        logger.info(f"Payment {razorpay_order_id} already marked SUCCESS. Skipping duplicate processing.")
        return {"status": "success", "message": "Already processed"}
        
    current_time = datetime.now()
    current_date = current_time.strftime("%Y-%m-%d")
    
    if event in ["order.paid", "payment.captured"]:
        payment_rec.status = "SUCCESS"
        payment_rec.razorpay_payment_id = razorpay_payment_id
        payment_rec.razorpay_signature = signature
        payment_rec.paid_at = current_time
        
        # Lock and update StudentFee record
        stmt_fee = select(StudentFee).where(StudentFee.id == payment_rec.fee_id).with_for_update()
        result_fee = await db.execute(stmt_fee)
        fee_rec = result_fee.scalars().first()
        
        if fee_rec:
            if payment_rec.installment_number == 1:
                fee_rec.installment_1_status = "paid"
                fee_rec.installment_1_payment_date = current_date
            elif payment_rec.installment_number == 2:
                fee_rec.installment_2_status = "paid"
                fee_rec.installment_2_payment_date = current_date
                
            logger.info(f"Updated StudentFee {fee_rec.id} for installment {payment_rec.installment_number} to paid.")
            
    elif event == "payment.failed":
        payment_rec.status = "FAILED"
        payment_rec.razorpay_payment_id = razorpay_payment_id
        logger.info(f"Payment {razorpay_order_id} failed.")
        
    await db.commit()
    return {"status": "success", "event": event}

@router.get("/student/history", response_model=List[PaymentHistoryResponse])
async def get_my_payment_history(
    db: AsyncSession = Depends(get_db),
    current_student: User = Depends(get_current_student)
):
    student = current_student.student
    if not student:
        raise HTTPException(status_code=400, detail="Student profile not found for user")
        
    stmt = select(Payment).where(Payment.student_id == student.id).order_by(Payment.created_at.desc())
    result = await db.execute(stmt)
    payments = result.scalars().all()
    
    return [
        PaymentHistoryResponse(
            id=str(p.id),
            installment_number=p.installment_number,
            gateway=p.gateway,
            amount=p.amount,
            receipt_no=p.receipt_no,
            status=p.status,
            created_at=p.created_at,
            paid_at=p.paid_at
        )
        for p in payments
    ]

