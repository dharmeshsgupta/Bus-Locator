from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.assignment import StudentAssignment, DriverAssignment
from app.models.enums import AssignmentStatus
import uuid
from typing import Optional

class AssignmentRepository:
    
    async def get_active_student_assignment(self, db: AsyncSession, student_id: uuid.UUID) -> Optional[StudentAssignment]:
        query = select(StudentAssignment).where(
            StudentAssignment.student_id == student_id,
            StudentAssignment.assignment_status == AssignmentStatus.ACTIVE,
            StudentAssignment.is_deleted == False
        )
        result = await db.execute(query)
        return result.scalars().first()

    async def get_active_driver_assignment(self, db: AsyncSession, driver_id: uuid.UUID) -> Optional[DriverAssignment]:
        query = select(DriverAssignment).where(
            DriverAssignment.driver_id == driver_id,
            DriverAssignment.assignment_status == AssignmentStatus.ACTIVE,
            DriverAssignment.is_deleted == False
        )
        result = await db.execute(query)
        return result.scalars().first()

    async def get_all_student_assignments(self, db: AsyncSession, skip: int = 0, limit: int = 100):
        query = select(StudentAssignment).where(
            StudentAssignment.assignment_status == AssignmentStatus.ACTIVE,
            StudentAssignment.is_deleted == False
        ).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def get_all_driver_assignments(self, db: AsyncSession, skip: int = 0, limit: int = 100):
        query = select(DriverAssignment).where(
            DriverAssignment.assignment_status == AssignmentStatus.ACTIVE,
            DriverAssignment.is_deleted == False
        ).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def create_student_assignment(self, db: AsyncSession, obj_in: dict) -> StudentAssignment:
        db_obj = StudentAssignment(**obj_in)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def create_driver_assignment(self, db: AsyncSession, obj_in: dict) -> DriverAssignment:
        db_obj = DriverAssignment(**obj_in)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

assignment_repository = AssignmentRepository()
