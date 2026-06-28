from fastapi import APIRouter
from app.api.dependencies import DbSession, AdminOrSuperAdmin, ActiveUser
from app.schemas.assignment import StudentAssignmentCreate, StudentAssignmentResponse, DriverAssignmentCreate, DriverAssignmentResponse
from app.services.assignment_service import assignment_service
import uuid

router = APIRouter(prefix="/assignments", tags=["assignments"])

@router.post("/student", response_model=StudentAssignmentResponse, status_code=201)
async def assign_student(data: StudentAssignmentCreate, db: DbSession, user: AdminOrSuperAdmin):
    return await assignment_service.assign_student(db, data, user.id)

@router.get("/student")
async def get_student_assignments(db: DbSession, user: AdminOrSuperAdmin, skip: int = 0, limit: int = 100):
    return await assignment_service.get_all_student_assignments(db, skip, limit)

@router.post("/driver", response_model=DriverAssignmentResponse, status_code=201)
async def assign_driver(data: DriverAssignmentCreate, db: DbSession, user: AdminOrSuperAdmin):
    return await assignment_service.assign_driver(db, data, user.id)

@router.get("/driver")
async def get_driver_assignments(db: DbSession, user: AdminOrSuperAdmin, skip: int = 0, limit: int = 100):
    return await assignment_service.get_all_driver_assignments(db, skip, limit)

@router.get("/drivers/me")
async def get_my_driver_assignment(db: DbSession, user: ActiveUser):
    # This expects a logged-in driver. We build the full dashboard payload.
    return await assignment_service.get_driver_full_assignment(db, user.id)

@router.get("/students/me")
async def get_my_assignment(db: DbSession, user: ActiveUser):
    # This should be StudentOnly, but ActiveUser is fine since we check student_id in DB
    return await assignment_service.get_student_full_assignment(db, user.id)
