from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as redis
import json
from datetime import datetime, timezone
import uuid
from typing import Optional

from app.models.location_log import LocationLog
from app.schemas.tracking import LocationUpdate

class TrackingRepository:
    def _redis_key(self, bus_id: uuid.UUID) -> str:
        return f"bus:{bus_id}:location"

    async def save_location_log(self, db: AsyncSession, data: LocationUpdate) -> LocationLog:
        log = LocationLog(
            bus_id=data.bus_id,
            latitude=data.latitude,
            longitude=data.longitude,
            speed=data.speed
        )
        db.add(log)
        await db.commit()
        await db.refresh(log)
        return log

    async def set_live_location(self, redis_client: redis.Redis, data: LocationUpdate) -> dict:
        key = self._redis_key(data.bus_id)
        payload = {
            "lat": data.latitude,
            "lng": data.longitude,
            "speed": data.speed,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        # Save to Redis
        await redis_client.set(key, json.dumps(payload))
        return payload

    async def get_live_location(self, redis_client: redis.Redis, bus_id: uuid.UUID) -> Optional[dict]:
        key = self._redis_key(bus_id)
        val = await redis_client.get(key)
        if val:
            return json.loads(val)
        return None

    async def get_all_live_locations(self, redis_client: redis.Redis) -> dict:
        keys = await redis_client.keys("bus:*:location")
        if not keys:
            return {}
        
        # MGET would be faster, but since they are small, a loop is fine, or we can use mget
        values = await redis_client.mget(keys)
        locations = {}
        for key, val in zip(keys, values):
            if val:
                # key is "bus:{bus_id}:location"
                # Decode key if it's bytes (depends on redis-py version)
                key_str = key.decode("utf-8") if isinstance(key, bytes) else key
                bus_id = key_str.split(":")[1]
                locations[bus_id] = json.loads(val)
        return locations

tracking_repository = TrackingRepository()
