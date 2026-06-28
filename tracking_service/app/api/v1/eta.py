from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as redis
import uuid

from app.schemas.eta import EtaUpdate
from app.services.eta_service import eta_service
from app.core.database import get_db
from app.core.redis import get_redis
from app.core.security import get_current_user, RequireRole

router = APIRouter()

@router.post("/update", status_code=status.HTTP_200_OK)
async def update_eta(
    data: EtaUpdate,
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
    user = Depends(RequireRole(["driver", "admin", "super_admin"]))
):
    await eta_service.process_eta_update(db, redis_client, data)
    return {"status": "success", "message": "ETA updated and broadcasted."}

@router.get("/route/{route_id}", status_code=status.HTTP_200_OK)
async def get_eta(
    route_id: uuid.UUID,
    redis_client: redis.Redis = Depends(get_redis),
    user = Depends(get_current_user)
):
    eta_data = await eta_service.get_route_eta(redis_client, route_id)
    return {"route_id": route_id, "stops": eta_data}
