from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as redis
import uuid
import structlog

from app.schemas.occupancy import OccupancyUpdate
from app.repositories.occupancy_repository import occupancy_repository
from app.websocket.manager import manager

logger = structlog.get_logger(__name__)

class OccupancyService:
    async def process_occupancy_update(
        self, db: AsyncSession, redis_client: redis.Redis, route_id: uuid.UUID, data: OccupancyUpdate
    ):
        # Note: Need route_id to broadcast to route, it's not in OccupancyUpdate schema 
        # so it must be provided by the API endpoint, or we broadcast to bus channel.
        # Requirements say: /ws/route/{route_id}/occupancy. So we must pass route_id.
        
        # 1. Update live state
        payload = await occupancy_repository.set_live_occupancy(redis_client, data)
        
        # 2. Broadcast
        if route_id:
            await manager.broadcast_to_route(str(route_id), "occupancy", payload)
            
        # 3. Store history
        await occupancy_repository.save_occupancy_log(db, data)
        return payload

    async def get_bus_occupancy(self, redis_client: redis.Redis, bus_id: uuid.UUID):
        return await occupancy_repository.get_live_occupancy(redis_client, bus_id)

occupancy_service = OccupancyService()
