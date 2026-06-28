from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.route import Route
from app.repositories.base_repository import BaseRepository
from typing import Optional

class RouteRepository(BaseRepository[Route]):
    def __init__(self):
        super().__init__(Route)

    async def get_by_code(self, db: AsyncSession, route_code: str) -> Optional[Route]:
        query = select(Route).where(Route.route_code == route_code, Route.is_deleted == False)
        result = await db.execute(query)
        return result.scalars().first()

route_repository = RouteRepository()
