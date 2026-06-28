from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.admin import Admin
from .base_repository import BaseRepository

class AdminRepository(BaseRepository[Admin]):
    def __init__(self):
        super().__init__(Admin)

admin_repository = AdminRepository()
