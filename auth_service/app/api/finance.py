from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, or_, and_, desc
from pydantic import BaseModel
from typing import Optional, List
import uuid
import csv
import io
from datetime import datetime, timezone, timedelta
import logging
import razorpay

from app.core.database import get_db
from app.api.dependencies import get_current_admin, get_current_student, get_current_user
from app.models.user import User
from app.models.student import Student
from app.models.student_fee import StudentFee
from app.models.payment import Payment, PaymentStatus
from app.models.refund import Refund, AuditLog
from app.models.finance_settings import FinanceSettings
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/payment", tags=["Enterprise Finance Module"])

# Initialize Razorpay Client
razorpay_client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

# --- Schemas ---

class RefundRequest(BaseModel):
    payment_id: uuid.UUID
    reason: str

class RefundReviewRequest(BaseModel):
    refund_id: uuid.UUID
    action: str # "APPROVE" or "REJECT"

class SettingsUpdate(BaseModel):
    grace_period_days: int
    late_fee_percentage: float
    reminder_frequency_days: int
    gst_percentage: float
    receipt_prefix: str
    invoice_prefix: str
    currency: str
    timezone: str
    academic_year: str

class AuditLogResponse(BaseModel):
    id: str
    user_email: Optional[str] = None
    role: Optional[str] = None
    action: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    old_values: Optional[dict] = None
    new_values: Optional[dict] = None
    reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Helpers ---

async def log_audit_event(
    db: AsyncSession,
    user: Optional[User],
    action: str,
    ip: Optional[str],
    ua: Optional[str],
    old_val: Optional[dict] = None,
    new_val: Optional[dict] = None,
    reason: Optional[str] = None
):
    try:
        log = AuditLog(
            user_id=user.id if user else None,
            user_email=user.email if user else "system@buslocator.com",
            role=user.role.value if user and hasattr(user.role, 'value') else (user.role if user else "system"),
            action=action,
            ip_address=ip,
            user_agent=ua,
            old_values=old_val,
            new_values=new_val,
            reason=reason
        )
        db.add(log)
        await db.commit()
    except Exception as e:
        logger.error(f"Failed to log audit event: {e}")

async def get_or_create_settings(db: AsyncSession) -> FinanceSettings:
    stmt = select(FinanceSettings)
    res = await db.execute(stmt)
    fs = res.scalars().first()
    if not fs:
        fs = FinanceSettings()
        db.add(fs)
        await db.commit()
        await db.refresh(fs)
    return fs

# --- Endpoints ---

@router.get("/admin/dashboard")
@router.get("/admin/statistics")
async def get_finance_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    # Total Revenue (All SUCCESS payments)
    stmt_rev = select(func.sum(Payment.amount)).where(Payment.status == "SUCCESS")
    total_revenue = await db.scalar(stmt_rev) or 0.0

    # Refunded Amount
    stmt_ref = select(func.sum(Refund.amount)).where(Refund.status == "SUCCESS")
    total_refunded = await db.scalar(stmt_ref) or 0.0

    # Pending Fees
    stmt_fees = select(StudentFee)
    res_fees = await db.execute(stmt_fees)
    fees = res_fees.scalars().all()
    
    pending_fees_total = 0.0
    for fee in fees:
        if fee.installment_1_status != "paid":
            pending_fees_total += fee.installment_1_amount
        if fee.installment_2_status != "paid":
            pending_fees_total += fee.installment_2_amount

    # Collected Today
    today_start = datetime.combine(datetime.now().date(), datetime.min.time())
    stmt_today = select(func.sum(Payment.amount)).where(
        and_(Payment.status == "SUCCESS", Payment.paid_at >= today_start)
    )
    collected_today = await db.scalar(stmt_today) or 0.0

    # Monthly Collection (current month)
    month_start = datetime.combine(datetime.now().replace(day=1), datetime.min.time())
    stmt_month = select(func.sum(Payment.amount)).where(
        and_(Payment.status == "SUCCESS", Payment.paid_at >= month_start)
    )
    collected_monthly = await db.scalar(stmt_month) or 0.0

    # Payment success vs failed counts
    stmt_success_cnt = select(func.count(Payment.id)).where(Payment.status == "SUCCESS")
    success_cnt = await db.scalar(stmt_success_cnt) or 0
    
    stmt_failed_cnt = select(func.count(Payment.id)).where(Payment.status == "FAILED")
    failed_cnt = await db.scalar(stmt_failed_cnt) or 0

    success_rate = (success_cnt / (success_cnt + failed_cnt) * 100) if (success_cnt + failed_cnt) > 0 else 100.0

    # Breakdown by Route, Batch, Department, Semester
    # Join Payment -> Student -> User
    stmt_breakdowns = select(Payment, Student).join(Student, Payment.student_id == Student.id).where(Payment.status == "SUCCESS")
    res_bd = await db.execute(stmt_breakdowns)
    bd_rows = res_bd.all()

    by_route = {}
    by_batch = {}
    by_department = {}
    by_semester = {}

    for pay, stud in bd_rows:
        route = stud.route_id or "Unassigned"
        batch = stud.batch or "Unknown Batch"
        dept = stud.department or "Unknown Dept"
        sem = stud.semester or "Unknown Sem"

        by_route[route] = by_route.get(route, 0.0) + pay.amount
        by_batch[batch] = by_batch.get(batch, 0.0) + pay.amount
        by_department[dept] = by_department.get(dept, 0.0) + pay.amount
        by_semester[sem] = by_semester.get(sem, 0.0) + pay.amount

    # Recent Transactions
    stmt_recent = select(Payment, User).join(Student, Payment.student_id == Student.id).join(User, Student.user_id == User.id).order_by(Payment.created_at.desc()).limit(5)
    res_recent = await db.execute(stmt_recent)
    recent_rows = res_recent.all()

    recent_transactions = [
        {
            "id": str(p.id),
            "student_name": u.name,
            "enrollment_no": u.student.enrollment_no if u.student else "N/A",
            "amount": p.amount,
            "status": p.status,
            "created_at": p.created_at
        }
        for p, u in recent_rows
    ]

    return {
        "metrics": {
            "total_revenue": total_revenue,
            "pending_fees": pending_fees_total,
            "collected_today": collected_today,
            "monthly_collection": collected_monthly,
            "success_rate": success_rate,
            "failed_payments": failed_cnt,
            "refunded_amount": total_refunded
        },
        "breakdowns": {
            "by_route": by_route,
            "by_batch": by_batch,
            "by_department": by_department,
            "by_semester": by_semester
        },
        "recent_transactions": recent_transactions
    }

@router.get("/admin/charts")
async def get_finance_dashboard_charts(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    # 1. Monthly Revenue Line Chart (past 6 months)
    monthly_revenue = []
    now = datetime.now()
    for i in range(5, -1, -1):
        target_month = now.replace(day=1) - timedelta(days=30 * i)
        start_date = target_month.replace(day=1, hour=0, minute=0, second=0)
        
        # Calculate month end
        if start_date.month == 12:
            end_date = start_date.replace(year=start_date.year + 1, month=1, day=1)
        else:
            end_date = start_date.replace(month=start_date.month + 1, day=1)
            
        stmt = select(func.sum(Payment.amount)).where(
            and_(Payment.status == "SUCCESS", Payment.paid_at >= start_date, Payment.paid_at < end_date)
        )
        month_sum = await db.scalar(stmt) or 0.0
        monthly_revenue.append({
            "month": start_date.strftime("%B %Y"),
            "amount": month_sum
        })

    # 2. Installment Collection Pie Chart
    stmt_i1 = select(func.sum(Payment.amount)).where(and_(Payment.status == "SUCCESS", Payment.installment_number == 1))
    i1_sum = await db.scalar(stmt_i1) or 0.0
    
    stmt_i2 = select(func.sum(Payment.amount)).where(and_(Payment.status == "SUCCESS", Payment.installment_number == 2))
    i2_sum = await db.scalar(stmt_i2) or 0.0

    installment_collection = [
        {"name": "Installment 01", "value": i1_sum},
        {"name": "Installment 02", "value": i2_sum}
    ]

    # 3. Daily Collection Bar Chart (past 7 days)
    daily_collection = []
    for i in range(6, -1, -1):
        day_date = now.date() - timedelta(days=i)
        start_dt = datetime.combine(day_date, datetime.min.time())
        end_dt = datetime.combine(day_date, datetime.max.time())
        
        stmt = select(func.sum(Payment.amount)).where(
            and_(Payment.status == "SUCCESS", Payment.paid_at >= start_dt, Payment.paid_at <= end_dt)
        )
        day_sum = await db.scalar(stmt) or 0.0
        daily_collection.append({
            "day": day_date.strftime("%a %d"),
            "amount": day_sum
        })

    return {
        "monthly_revenue": monthly_revenue,
        "installment_collection": installment_collection,
        "daily_collection": daily_collection
    }

@router.get("/admin/payments")
async def get_admin_payments_ledger(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    stmt = select(Payment, User).join(Student, Payment.student_id == Student.id).join(User, Student.user_id == User.id)
    count_stmt = select(func.count(Payment.id)).join(Student, Payment.student_id == Student.id).join(User, Student.user_id == User.id)

    if search:
        search_filter = or_(
            User.name.ilike(f"%{search}%"),
            Student.enrollment_no.ilike(f"%{search}%"),
            Payment.razorpay_order_id.ilike(f"%{search}%"),
            Payment.razorpay_payment_id.ilike(f"%{search}%"),
            Payment.receipt_no.ilike(f"%{search}%")
        )
        stmt = stmt.where(search_filter)
        count_stmt = count_stmt.where(search_filter)

    if status:
        stmt = stmt.where(Payment.status == status)
        count_stmt = count_stmt.where(Payment.status == status)

    stmt = stmt.order_by(Payment.created_at.desc())
    total = await db.scalar(count_stmt)

    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    rows = result.all()

    items = []
    for p, u in rows:
        items.append({
            "id": str(p.id),
            "student_name": u.name,
            "enrollment_no": u.student.enrollment_no if u.student else "N/A",
            "gateway": p.gateway,
            "order_id": p.razorpay_order_id,
            "payment_id": p.razorpay_payment_id,
            "amount": p.amount,
            "status": p.status,
            "receipt_no": p.receipt_no,
            "created_at": p.created_at,
            "paid_at": p.paid_at,
            "installment_number": p.installment_number
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.get("/admin/payment/{id}")
async def get_payment_by_id(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    stmt = select(Payment, User).join(Student, Payment.student_id == Student.id).join(User, Student.user_id == User.id).where(Payment.id == id)
    res = await db.execute(stmt)
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Payment record not found")
    p, u = row
    return {
        "id": str(p.id),
        "student_name": u.name,
        "enrollment_no": u.student.enrollment_no if u.student else "N/A",
        "gateway": p.gateway,
        "order_id": p.razorpay_order_id,
        "payment_id": p.razorpay_payment_id,
        "amount": p.amount,
        "status": p.status,
        "receipt_no": p.receipt_no,
        "created_at": p.created_at,
        "paid_at": p.paid_at,
        "installment_number": p.installment_number
    }

@router.post("/admin/refund")
async def process_refund(
    data: RefundRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    # Lock the payment row
    stmt = select(Payment).where(Payment.id == data.payment_id).with_for_update()
    result = await db.execute(stmt)
    payment = result.scalars().first()

    if not payment:
        raise HTTPException(status_code=404, detail="Payment transaction not found")

    if payment.status != "SUCCESS":
        raise HTTPException(status_code=400, detail="Only successful transactions can be refunded")

    # Check if a refund already exists
    stmt_ref = select(Refund).where(Refund.payment_id == payment.id)
    res_ref = await db.execute(stmt_ref)
    existing_refund = res_ref.scalars().first()
    if existing_refund:
        raise HTTPException(status_code=400, detail="Refund has already been initiated for this payment")

    # Create a PENDING refund record
    refund = Refund(
        payment_id=payment.id,
        student_id=payment.student_id,
        amount=payment.amount,
        currency=payment.currency,
        status="PENDING",
        reason=data.reason
    )
    db.add(refund)
    await db.commit()

    # Log action
    user_ip = request.client.host if request.client else None
    user_ua = request.headers.get("User-Agent")
    await log_audit_event(
        db, current_admin, f"REFUND_REQUESTED: Payment ID {payment.id}",
        user_ip, user_ua, None, {"refund_id": str(refund.id)}, data.reason
    )

    return {"message": "Refund requested successfully. Pending admin review.", "refund_id": str(refund.id)}

@router.post("/admin/refund/review")
async def review_refund(
    data: RefundReviewRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    stmt = select(Refund).where(Refund.id == data.refund_id).with_for_update()
    res = await db.execute(stmt)
    refund = res.scalars().first()

    if not refund:
        raise HTTPException(status_code=404, detail="Refund request not found")

    if refund.status != "PENDING":
        raise HTTPException(status_code=400, detail=f"Refund request is already {refund.status}")

    # Fetch corresponding payment
    stmt_pay = select(Payment).where(Payment.id == refund.payment_id).with_for_update()
    res_pay = await db.execute(stmt_pay)
    payment = res_pay.scalars().first()

    user_ip = request.client.host if request.client else None
    user_ua = request.headers.get("User-Agent")

    if data.action == "REJECT":
        refund.status = "REJECTED"
        await db.commit()
        await log_audit_event(
            db, current_admin, f"REFUND_REJECTED: Refund ID {refund.id}",
            user_ip, user_ua, None, None, "Review rejection"
        )
        return {"message": "Refund request rejected successfully"}

    elif data.action == "APPROVE":
        # Process refund with Razorpay
        try:
            if settings.RAZORPAY_KEY_ID == "rzp_test_placeholder":
                # Sandbox simulation
                logger.info("Simulating Razorpay refund in sandbox mode.")
                razorpay_refund_id = f"rfnd_mock_{uuid.uuid4().hex[:14].upper()}"
            else:
                # Real Razorpay refund SDK
                rzp_refund = razorpay_client.refund.create({
                    "payment_id": payment.razorpay_payment_id,
                    "amount": int(payment.amount * 100), # in paise
                    "speed": "normal"
                })
                razorpay_refund_id = rzp_refund["id"]

            refund.status = "SUCCESS"
            refund.razorpay_refund_id = razorpay_refund_id
            refund.processed_at = datetime.now()

            # Mark Payment as REFUNDED
            payment.status = "REFUNDED"

            # Reset student_fees installment status to pending
            stmt_fee = select(StudentFee).where(StudentFee.id == payment.fee_id).with_for_update()
            res_fee = await db.execute(stmt_fee)
            fee = res_fee.scalars().first()
            if fee:
                if payment.installment_number == 1:
                    fee.installment_1_status = "pending"
                    fee.installment_1_payment_date = None
                elif payment.installment_number == 2:
                    fee.installment_2_status = "pending"
                    fee.installment_2_payment_date = None

            await db.commit()
            
            await log_audit_event(
                db, current_admin, f"REFUND_APPROVED: Refund ID {refund.id}",
                user_ip, user_ua, None, {"razorpay_refund_id": razorpay_refund_id}, refund.reason
            )
            return {"message": "Refund processed successfully. Payment status updated to REFUNDED."}

        except Exception as e:
            logger.error(f"Razorpay refund failed: {e}")
            refund.status = "FAILED"
            await db.commit()
            raise HTTPException(status_code=500, detail=f"Razorpay refund execution failed: {str(e)}")

    else:
        raise HTTPException(status_code=400, detail="Invalid action. Must be APPROVE or REJECT.")

@router.get("/admin/refunds")
async def get_admin_refunds(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    stmt = select(Refund, User).join(Student, Refund.student_id == Student.id).join(User, Student.user_id == User.id).order_by(Refund.created_at.desc())
    res = await db.execute(stmt)
    rows = res.all()

    return [
        {
            "id": str(r.id),
            "payment_id": str(r.payment_id),
            "student_name": u.name,
            "enrollment_no": u.student.enrollment_no if u.student else "N/A",
            "amount": r.amount,
            "status": r.status,
            "reason": r.reason,
            "razorpay_refund_id": r.razorpay_refund_id,
            "created_at": r.created_at,
            "processed_at": r.processed_at
        }
        for r, u in rows
    ]

@router.get("/student/refunds")
async def get_student_refunds(
    db: AsyncSession = Depends(get_db),
    current_student: User = Depends(get_current_student)
):
    student = current_student.student
    if not student:
        raise HTTPException(status_code=400, detail="Student profile not found")
        
    stmt = select(Refund).where(Refund.student_id == student.id).order_by(Refund.created_at.desc())
    res = await db.execute(stmt)
    refunds = res.scalars().all()

    return [
        {
            "id": str(r.id),
            "payment_id": str(r.payment_id),
            "amount": r.amount,
            "status": r.status,
            "reason": r.reason,
            "created_at": r.created_at,
            "processed_at": r.processed_at
        }
        for r in refunds
    ]

@router.get("/admin/settings")
async def get_finance_rules(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    fs = await get_or_create_settings(db)
    return {
        "grace_period_days": fs.grace_period_days,
        "late_fee_percentage": fs.late_fee_percentage,
        "reminder_frequency_days": fs.reminder_frequency_days,
        "gst_percentage": fs.gst_percentage,
        "receipt_prefix": fs.receipt_prefix,
        "invoice_prefix": fs.invoice_prefix,
        "currency": fs.currency,
        "timezone": fs.timezone,
        "academic_year": fs.academic_year
    }

@router.put("/admin/settings")
async def update_finance_rules(
    data: SettingsUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    fs = await get_or_create_settings(db)
    
    old_val = {
        "grace_period_days": fs.grace_period_days,
        "late_fee_percentage": fs.late_fee_percentage,
        "reminder_frequency_days": fs.reminder_frequency_days,
        "gst_percentage": fs.gst_percentage,
        "receipt_prefix": fs.receipt_prefix,
        "invoice_prefix": fs.invoice_prefix,
        "currency": fs.currency,
        "timezone": fs.timezone,
        "academic_year": fs.academic_year
    }

    fs.grace_period_days = data.grace_period_days
    fs.late_fee_percentage = data.late_fee_percentage
    fs.reminder_frequency_days = data.reminder_frequency_days
    fs.gst_percentage = data.gst_percentage
    fs.receipt_prefix = data.receipt_prefix
    fs.invoice_prefix = data.invoice_prefix
    fs.currency = data.currency
    fs.timezone = data.timezone
    fs.academic_year = data.academic_year

    await db.commit()

    # Log audit
    user_ip = request.client.host if request.client else None
    user_ua = request.headers.get("User-Agent")
    await log_audit_event(
        db, current_admin, "SETTINGS_UPDATED",
        user_ip, user_ua, old_val, data.dict(), "Update finance configs"
    )

    return {"message": "Settings updated successfully", "settings": data}

@router.get("/admin/audit")
async def get_audit_trail(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=200),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    stmt = select(AuditLog)
    count_stmt = select(func.count(AuditLog.id))

    if search:
        search_filter = or_(
            AuditLog.user_email.ilike(f"%{search}%"),
            AuditLog.action.ilike(f"%{search}%"),
            AuditLog.reason.ilike(f"%{search}%")
        )
        stmt = stmt.where(search_filter)
        count_stmt = count_stmt.where(search_filter)

    stmt = stmt.order_by(AuditLog.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    total = await db.scalar(count_stmt)

    res = await db.execute(stmt)
    logs = res.scalars().all()

    return {
        "items": [
            {
                "id": str(l.id),
                "user_email": l.user_email,
                "role": l.role,
                "action": l.action,
                "ip_address": l.ip_address,
                "user_agent": l.user_agent,
                "old_values": l.old_values,
                "new_values": l.new_values,
                "reason": l.reason,
                "created_at": l.created_at
            }
            for l in logs
        ],
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.get("/admin/report")
async def export_finance_report(
    report_type: str = Query("all"), # "all", "outstanding", "collected"
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    # Generates a CSV stream response
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        "Receipt Number", "Student Name", "Enrollment No", "Gateway", 
        "Transaction ID", "Amount", "Installment", "Status", "Payment Date"
    ])

    if report_type == "outstanding":
        # Outstanding/Unpaid installments
        stmt = select(StudentFee, User).join(Student, StudentFee.student_id == Student.id).join(User, Student.user_id == User.id)
        res = await db.execute(stmt)
        rows = res.all()
        for f, u in rows:
            if f.installment_1_status != "paid":
                writer.writerow([
                    "N/A", u.name, f.student.enrollment_no, "N/A", "N/A", f.installment_1_amount, 1, "PENDING", "N/A"
                ])
            if f.installment_2_status != "paid":
                writer.writerow([
                    "N/A", u.name, f.student.enrollment_no, "N/A", "N/A", f.installment_2_amount, 2, "PENDING", "N/A"
                ])
    else:
        # All transactions or collected only
        stmt = select(Payment, User).join(Student, Payment.student_id == Student.id).join(User, Student.user_id == User.id)
        if report_type == "collected":
            stmt = stmt.where(Payment.status == "SUCCESS")
        
        res = await db.execute(stmt)
        rows = res.all()
        for p, u in rows:
            writer.writerow([
                p.receipt_no or "N/A", u.name, u.student.enrollment_no if u.student else "N/A", 
                p.gateway, p.razorpay_payment_id or "N/A", p.amount, p.installment_number, p.status, 
                p.paid_at.strftime("%Y-%m-%d %H:%M:%S") if p.paid_at else "N/A"
            ])

    output.seek(0)
    
    # Stream Response
    filename = f"finance_report_{report_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.post("/cron/late-fees")
async def trigger_late_fees_job(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    # Assessment cron job: marks unpaid invoices overdue and applies late fee percentages
    fs = await get_or_create_settings(db)
    current_date = datetime.now().strftime("%Y-%m-%d")

    stmt = select(StudentFee)
    res = await db.execute(stmt)
    fees = res.scalars().all()

    applied_count = 0
    overdue_count = 0

    for fee in fees:
        # Check installment 1
        if fee.installment_1_status != "paid" and fee.installment_1_deadline:
            due_dt = datetime.strptime(fee.installment_1_deadline, "%Y-%m-%d")
            grace_dt = due_dt + timedelta(days=fs.grace_period_days)
            
            if grace_dt.strftime("%Y-%m-%d") < current_date:
                # Apply late fee percentage
                surcharge = fee.installment_1_amount * (fs.late_fee_percentage / 100.0)
                if surcharge > 0:
                    fee.installment_1_amount += surcharge
                    applied_count += 1
                    logger.info(f"Applied late fee surcharge of {surcharge} to student fee {fee.id} installment 1")
                    
        # Check installment 2
        if fee.installment_2_status != "paid" and fee.installment_2_deadline:
            due_dt = datetime.strptime(fee.installment_2_deadline, "%Y-%m-%d")
            grace_dt = due_dt + timedelta(days=fs.grace_period_days)
            
            if grace_dt.strftime("%Y-%m-%d") < current_date:
                surcharge = fee.installment_2_amount * (fs.late_fee_percentage / 100.0)
                if surcharge > 0:
                    fee.installment_2_amount += surcharge
                    applied_count += 1
                    logger.info(f"Applied late fee surcharge of {surcharge} to student fee {fee.id} installment 2")

    await db.commit()

    # Log System Audit Event
    await log_audit_event(
        db, None, "CRON_LATE_FEES_ASSESSMENT",
        "127.0.0.1", "cronjob", None, {"applied_surcharges": applied_count}, "Daily automatic late fees cron job"
    )

    return {
        "status": "success",
        "processed_date": current_date,
        "late_fees_applied": applied_count
    }
