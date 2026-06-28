from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.user import User
from app.models.enums import UserRole
from .base_repository import BaseRepository

class UserRepository(BaseRepository[User]):
    def __init__(self):
        super().__init__(User)

    async def get_by_email(self, db: AsyncSession, email: str) -> Optional[User]:
        stmt = select(User).where(User.email == email)
        result = await db.execute(stmt)
        return result.scalars().first()

    async def get_by_phone(self, db: AsyncSession, phone: str) -> Optional[User]:
        stmt = select(User).where(User.phone == phone)
        result = await db.execute(stmt)
        return result.scalars().first()
        
    async def get_by_firebase_uid(self, db: AsyncSession, firebase_uid: str) -> Optional[User]:
        stmt = select(User).where(User.firebase_uid == firebase_uid)
        result = await db.execute(stmt)
        return result.scalars().first()

    async def get_all_by_role(self, db: AsyncSession, role: UserRole) -> list[User]:
        stmt = select(User).where(User.role == role)
        result = await db.execute(stmt)
        return list(result.scalars().all())

user_repository = UserRepository()
