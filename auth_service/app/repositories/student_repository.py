from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.student import Student
from .base_repository import BaseRepository

class StudentRepository(BaseRepository[Student]):
    def __init__(self):
        super().__init__(Student)

    async def get_by_enrollment_no(self, db: AsyncSession, enrollment_no: str) -> Optional[Student]:
        stmt = select(Student).where(Student.enrollment_no == enrollment_no)
        result = await db.execute(stmt)
        return result.scalars().first()

student_repository = StudentRepository()
