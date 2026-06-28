from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as redis
import json
import uuid
from typing import Optional

from app.models.occupancy_log import OccupancyLog
from app.schemas.occupancy import OccupancyUpdate

class OccupancyRepository:
    def _redis_key(self, bus_id: uuid.UUID) -> str:
        return f"bus:{bus_id}:occupancy"

    async def save_occupancy_log(self, db: AsyncSession, data: OccupancyUpdate) -> OccupancyLog:
        log = OccupancyLog(
            bus_id=data.bus_id,
            occupied_seats=data.occupied,
            available_seats=data.available
        )
        db.add(log)
        await db.commit()
        await db.refresh(log)
        return log

    async def set_live_occupancy(self, redis_client: redis.Redis, data: OccupancyUpdate) -> dict:
        key = self._redis_key(data.bus_id)
        payload = {
            "occupied": data.occupied,
            "available": data.available
        }
        await redis_client.set(key, json.dumps(payload))
        return payload

    async def get_live_occupancy(self, redis_client: redis.Redis, bus_id: uuid.UUID) -> Optional[dict]:
        key = self._redis_key(bus_id)
        val = await redis_client.get(key)
        if val:
            return json.loads(val)
        return None

occupancy_repository = OccupancyRepository()
