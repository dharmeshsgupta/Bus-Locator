from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as redis
import uuid

from app.schemas.tracking import LocationUpdate
from app.services.tracking_service import tracking_service
from app.core.database import get_db
from app.core.redis import get_redis
from app.core.security import get_current_user, RequireRole

router = APIRouter()

@router.post("/location", status_code=status.HTTP_200_OK)
async def update_location(
    data: LocationUpdate,
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
    user = Depends(RequireRole(["driver", "admin", "super_admin"]))
):
    # Only drivers (or admins) can publish updates
    await tracking_service.process_location_update(db, redis_client, data)
    return {"status": "success", "message": "Location updated and broadcasted."}

@router.get("/fleet", status_code=status.HTTP_200_OK)
async def get_fleet_locations(
    redis_client: redis.Redis = Depends(get_redis),
    user = Depends(RequireRole(["admin", "superadmin"]))
):
    # Returns the latest location snapshot of all active buses
    locations = await tracking_service.get_fleet_locations(redis_client)
    return {"status": "success", "data": locations}

from app.schemas.tracking import LocationUpdate, RouteStateTransition, EmergencyReport, OccupancyUpdate

@router.get("/bus/{bus_id}", status_code=status.HTTP_200_OK)
async def get_bus_location(
    bus_id: uuid.UUID,
    redis_client: redis.Redis = Depends(get_redis),
    user = Depends(get_current_user)
):
    # Any authenticated user can check live location
    location = await tracking_service.get_bus_location(redis_client, bus_id)
    if not location:
        raise HTTPException(status_code=404, detail="Bus location not found in real-time cache.")
    return location

@router.post("/route/{action}", status_code=status.HTTP_200_OK)
async def update_route_state(
    action: str,
    data: RouteStateTransition,
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
    user = Depends(RequireRole(["driver", "admin", "super_admin"]))
):
    valid_actions = ["start", "pause", "resume", "end", "cancel"]
    if action not in valid_actions:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    # Store state transition logic in tracking service
    await tracking_service.process_state_transition(db, redis_client, data, action)
    return {"status": "success", "message": f"Route state updated to {action}."}

@router.post("/emergency", status_code=status.HTTP_200_OK)
async def report_emergency(
    data: EmergencyReport,
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
    user = Depends(RequireRole(["driver", "admin", "super_admin"]))
):
    await tracking_service.process_emergency(db, redis_client, data)
    return {"status": "success", "message": "Emergency reported and broadcasted."}

@router.post("/occupancy", status_code=status.HTTP_200_OK)
async def update_occupancy(
    data: OccupancyUpdate,
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
    user = Depends(RequireRole(["driver", "admin", "super_admin"]))
):
    await tracking_service.process_occupancy_update(db, redis_client, data)
    return {"status": "success", "message": "Occupancy updated."}
