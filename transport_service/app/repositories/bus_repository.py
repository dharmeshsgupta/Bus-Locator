from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.bus import Bus
from app.repositories.base_repository import BaseRepository
from typing import Optional

class BusRepository(BaseRepository[Bus]):
    def __init__(self):
        super().__init__(Bus)

    async def get_by_registration(self, db: AsyncSession, registration_number: str) -> Optional[Bus]:
        query = select(Bus).where(Bus.registration_number == registration_number, Bus.is_deleted == False)
        result = await db.execute(query)
        return result.scalars().first()
        
    async def get_by_bus_number(self, db: AsyncSession, bus_number: str) -> Optional[Bus]:
        query = select(Bus).where(Bus.bus_number == bus_number, Bus.is_deleted == False)
        result = await db.execute(query)
        return result.scalars().first()

bus_repository = BusRepository()
