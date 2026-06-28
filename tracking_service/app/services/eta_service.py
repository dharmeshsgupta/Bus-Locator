from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as redis
import uuid
import structlog

from app.schemas.eta import EtaUpdate
from app.repositories.eta_repository import eta_repository
from app.websocket.manager import manager

logger = structlog.get_logger(__name__)

class EtaService:
    async def process_eta_update(
        self, db: AsyncSession, redis_client: redis.Redis, data: EtaUpdate
    ):
        payload = await eta_repository.set_live_eta(redis_client, data)
        await manager.broadcast_to_route(str(data.route_id), "eta", payload)
        await eta_repository.save_eta_log(db, data)
        return payload

    async def get_route_eta(self, redis_client: redis.Redis, route_id: uuid.UUID):
        return await eta_repository.get_live_eta_for_route(redis_client, route_id)

eta_service = EtaService()
