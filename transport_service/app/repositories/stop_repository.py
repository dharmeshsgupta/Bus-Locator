from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.stop import Stop
from app.repositories.base_repository import BaseRepository
import uuid
from typing import List, Tuple

class StopRepository(BaseRepository[Stop]):
    def __init__(self):
        super().__init__(Stop)

    async def get_by_route(self, db: AsyncSession, route_id: uuid.UUID, skip: int = 0, limit: int = 100) -> Tuple[List[Stop], int]:
        query = select(Stop).where(Stop.route_id == route_id, Stop.is_deleted == False).order_by(Stop.sequence_number)
        
        count_query = select(func.count()).select_from(query.subquery())
        total = await db.scalar(count_query)
        
        items_query = query.offset(skip).limit(limit)
        result = await db.execute(items_query)
        items = list(result.scalars().all())
        
        return items, total

    async def get_by_sequence(self, db: AsyncSession, route_id: uuid.UUID, sequence_number: int) -> Stop | None:
        query = select(Stop).where(Stop.route_id == route_id, Stop.sequence_number == sequence_number, Stop.is_deleted == False)
        result = await db.execute(query)
        return result.scalars().first()

stop_repository = StopRepository()
