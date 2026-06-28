from fastapi import APIRouter, Query
from app.api.dependencies import DbSession, AdminOrSuperAdmin, ActiveUser
from app.schemas.stop import StopCreate, StopUpdate, StopResponse
from app.schemas.common import PageResponse
from app.services.stop_service import stop_service
import uuid

router = APIRouter(prefix="/stops", tags=["stops"])

@router.post("", response_model=StopResponse, status_code=201)
async def create_stop(data: StopCreate, db: DbSession, user: AdminOrSuperAdmin):
    return await stop_service.create_stop(db, data, user.id)

@router.get("/route/{route_id}", response_model=PageResponse[StopResponse])
async def get_stops_by_route(
    route_id: uuid.UUID,
    db: DbSession, 
    user: ActiveUser,
    page: int = Query(1, ge=1), 
    page_size: int = Query(20, ge=1, le=100)
):
    skip = (page - 1) * page_size
    items, total = await stop_service.get_stops_by_route(db, route_id, skip=skip, limit=page_size)
    total_pages = (total + page_size - 1) // page_size
    return PageResponse(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)

@router.get("/{id}", response_model=StopResponse)
async def get_stop(id: uuid.UUID, db: DbSession, user: ActiveUser):
    return await stop_service.get_stop(db, id)

@router.put("/{id}", response_model=StopResponse)
async def update_stop(id: uuid.UUID, data: StopUpdate, db: DbSession, user: AdminOrSuperAdmin):
    return await stop_service.update_stop(db, id, data, user.id)

@router.delete("/{id}", status_code=204)
async def delete_stop(id: uuid.UUID, db: DbSession, user: AdminOrSuperAdmin):
    await stop_service.delete_stop(db, id, user.id)
