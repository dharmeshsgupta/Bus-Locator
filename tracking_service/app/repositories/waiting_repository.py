from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as redis
import uuid
from typing import Optional, Dict

from app.models.waiting_log import WaitingLog
from app.schemas.waiting import WaitingUpdate

class WaitingRepository:
    def _redis_key(self, route_id: uuid.UUID) -> str:
        return f"route:{route_id}:waiting_students"

    async def save_waiting_log(self, db: AsyncSession, data: WaitingUpdate) -> WaitingLog:
        log = WaitingLog(
            route_id=data.route_id,
            stop_id=data.stop_id,
            waiting_count=data.count
        )
        db.add(log)
        await db.commit()
        await db.refresh(log)
        return log

    async def set_live_waiting(self, redis_client: redis.Redis, data: WaitingUpdate) -> dict:
        key = self._redis_key(data.route_id)
        # Using Redis Hash (HSET)
        await redis_client.hset(key, str(data.stop_id), str(data.count))
        return {
            "stop_id": str(data.stop_id),
            "count": data.count
        }

    async def get_live_waiting_for_route(self, redis_client: redis.Redis, route_id: uuid.UUID) -> Dict[str, int]:
        key = self._redis_key(route_id)
        val = await redis_client.hgetall(key)
        # val is a dict mapping stop_id to count, but values are strings
        return {k: int(v) for k, v in val.items()}

waiting_repository = WaitingRepository()
