from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as redis
import uuid
import structlog

from app.schemas.waiting import WaitingUpdate
from app.repositories.waiting_repository import waiting_repository
from app.websocket.manager import manager

logger = structlog.get_logger(__name__)

class WaitingService:
    async def process_waiting_update(
        self, db: AsyncSession, redis_client: redis.Redis, data: WaitingUpdate
    ):
        payload = await waiting_repository.set_live_waiting(redis_client, data)
        await manager.broadcast_to_route(str(data.route_id), "waiting", payload)
        await waiting_repository.save_waiting_log(db, data)
        return payload

    async def get_route_waiting(self, redis_client: redis.Redis, route_id: uuid.UUID):
        return await waiting_repository.get_live_waiting_for_route(redis_client, route_id)

waiting_service = WaitingService()
