from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.driver import Driver
from .base_repository import BaseRepository

class DriverRepository(BaseRepository[Driver]):
    def __init__(self):
        super().__init__(Driver)

driver_repository = DriverRepository()
