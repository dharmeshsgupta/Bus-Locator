from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as redis
import uuid

from app.schemas.waiting import WaitingUpdate
from app.services.waiting_service import waiting_service
from app.core.database import get_db
from app.core.redis import get_redis
from app.core.security import get_current_user, RequireRole

router = APIRouter()

@router.post("/update", status_code=status.HTTP_200_OK)
async def update_waiting_count(
    data: WaitingUpdate,
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
    user = Depends(RequireRole(["student", "driver", "admin", "super_admin"]))
):
    await waiting_service.process_waiting_update(db, redis_client, data)
    return {"status": "success", "message": "Waiting count updated and broadcasted."}

@router.get("/route/{route_id}", status_code=status.HTTP_200_OK)
async def get_waiting_count(
    route_id: uuid.UUID,
    redis_client: redis.Redis = Depends(get_redis),
    user = Depends(get_current_user)
):
    waiting_data = await waiting_service.get_route_waiting(redis_client, route_id)
    return {"route_id": route_id, "stops": waiting_data}
