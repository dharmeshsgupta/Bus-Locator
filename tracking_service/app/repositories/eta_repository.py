from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as redis
import uuid
from typing import Dict

from app.models.eta_log import EtaLog
from app.schemas.eta import EtaUpdate

class EtaRepository:
    def _redis_key(self, route_id: uuid.UUID) -> str:
        return f"route:{route_id}:eta"

    async def save_eta_log(self, db: AsyncSession, data: EtaUpdate) -> EtaLog:
        log = EtaLog(
            route_id=data.route_id,
            stop_id=data.stop_id,
            eta_minutes=data.eta_minutes
        )
        db.add(log)
        await db.commit()
        await db.refresh(log)
        return log

    async def set_live_eta(self, redis_client: redis.Redis, data: EtaUpdate) -> dict:
        key = self._redis_key(data.route_id)
        # Using Redis Hash (HSET)
        await redis_client.hset(key, str(data.stop_id), str(data.eta_minutes))
        return {
            "stop_id": str(data.stop_id),
            "eta_minutes": data.eta_minutes
        }

    async def get_live_eta_for_route(self, redis_client: redis.Redis, route_id: uuid.UUID) -> Dict[str, int]:
        key = self._redis_key(route_id)
        val = await redis_client.hgetall(key)
        return {k: int(v) for k, v in val.items()}

eta_repository = EtaRepository()
