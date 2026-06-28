from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as redis
import uuid
from pydantic import BaseModel

from app.schemas.occupancy import OccupancyUpdate
from app.services.occupancy_service import occupancy_service
from app.core.database import get_db
from app.core.redis import get_redis
from app.core.security import get_current_user, RequireRole

router = APIRouter()

class OccupancyUpdateRequest(OccupancyUpdate):
    route_id: uuid.UUID

@router.post("/update", status_code=status.HTTP_200_OK)
async def update_occupancy(
    data: OccupancyUpdateRequest,
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
    user = Depends(RequireRole(["driver", "admin", "super_admin"]))
):
    occupancy_data = OccupancyUpdate(bus_id=data.bus_id, occupied=data.occupied, available=data.available)
    await occupancy_service.process_occupancy_update(db, redis_client, data.route_id, occupancy_data)
    return {"status": "success", "message": "Occupancy updated and broadcasted."}

@router.get("/bus/{bus_id}", status_code=status.HTTP_200_OK)
async def get_bus_occupancy(
    bus_id: uuid.UUID,
    redis_client: redis.Redis = Depends(get_redis),
    user = Depends(get_current_user)
):
    occupancy = await occupancy_service.get_bus_occupancy(redis_client, bus_id)
    if not occupancy:
        raise HTTPException(status_code=404, detail="Bus occupancy not found in real-time cache.")
    return occupancy
