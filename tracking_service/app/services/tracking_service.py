from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as redis
import uuid
import structlog
import asyncio

from app.schemas.tracking import LocationUpdate
from app.repositories.tracking_repository import tracking_repository
from app.websocket.manager import manager

logger = structlog.get_logger(__name__)

class TrackingService:
    async def process_location_update(
        self, db: AsyncSession, redis_client: redis.Redis, data: LocationUpdate
    ):
        # 1. Update live state in Redis
        payload = await tracking_repository.set_live_location(redis_client, data)
        
        # 2. Broadcast via WebSocket Manager
        await manager.broadcast_to_route(str(data.route_id), "location", payload)
        
        # 3. Store history in DB asynchronously (could be pushed to a celery task, but we await it here)
        await tracking_repository.save_location_log(db, data)
        
        return payload

    async def get_bus_location(self, redis_client: redis.Redis, bus_id: uuid.UUID):
        return await tracking_repository.get_live_location(redis_client, bus_id)

    async def get_fleet_locations(self, redis_client: redis.Redis):
        return await tracking_repository.get_all_live_locations(redis_client)

    async def process_state_transition(self, db: AsyncSession, redis_client: redis.Redis, data, action: str):
        # Store state in Redis so clients can quickly read it
        state_map = {
            "start": "IN_PROGRESS",
            "pause": "PAUSED",
            "resume": "IN_PROGRESS",
            "end": "COMPLETED",
            "cancel": "CANCELLED"
        }
        new_state = state_map.get(action, "NOT_STARTED")
        
        await redis_client.hset(
            f"route:{data.route_id}",
            mapping={
                "bus_id": str(data.bus_id),
                "status": new_state
            }
        )
        
        # Broadcast route state update
        await manager.broadcast_to_route(str(data.route_id), "route_status", {
            "bus_id": str(data.bus_id),
            "route_id": str(data.route_id),
            "status": new_state,
            "action": action
        })

    async def process_emergency(self, db: AsyncSession, redis_client: redis.Redis, data):
        # Broadcast emergency immediately to the route channel (admins usually subscribe to all routes or a global channel)
        await manager.broadcast_to_route(str(data.route_id), "emergency", data.model_dump())
        logger.error(f"EMERGENCY REPORTED: Bus {data.bus_id} on Route {data.route_id} - {data.type}: {data.message}")
        
    async def process_occupancy_update(self, db: AsyncSession, redis_client: redis.Redis, data):
        # Store latest occupancy in Redis
        key = f"bus:{data.bus_id}:occupancy"
        current = await redis_client.get(key)
        new_occ = max(0, int(current or 0) + data.occupancy_change)
        await redis_client.set(key, new_occ)
        
        await manager.broadcast_to_route(str(data.route_id), "occupancy", {
            "bus_id": str(data.bus_id),
            "route_id": str(data.route_id),
            "occupancy": new_occ
        })

tracking_service = TrackingService()
