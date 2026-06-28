from fastapi import APIRouter, Query
from app.api.dependencies import DbSession, AdminOrSuperAdmin, ActiveUser
from app.schemas.bus import BusCreate, BusUpdate, BusResponse
from app.schemas.common import PageResponse
from app.services.bus_service import bus_service
import uuid

router = APIRouter(prefix="/buses", tags=["buses"])

@router.post("", response_model=BusResponse, status_code=201)
async def create_bus(data: BusCreate, db: DbSession, user: AdminOrSuperAdmin):
    return await bus_service.create_bus(db, data, user.id)

@router.get("", response_model=PageResponse[BusResponse])
async def get_buses(
    db: DbSession, 
    user: ActiveUser,
    page: int = Query(1, ge=1), 
    page_size: int = Query(20, ge=1, le=100)
):
    skip = (page - 1) * page_size
    items, total = await bus_service.get_buses(db, skip=skip, limit=page_size)
    total_pages = (total + page_size - 1) // page_size
    return PageResponse(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)

@router.get("/{id}", response_model=BusResponse)
async def get_bus(id: uuid.UUID, db: DbSession, user: ActiveUser):
    return await bus_service.get_bus(db, id)

@router.put("/{id}", response_model=BusResponse)
async def update_bus(id: uuid.UUID, data: BusUpdate, db: DbSession, user: AdminOrSuperAdmin):
    return await bus_service.update_bus(db, id, data, user.id)

@router.delete("/{id}", status_code=204)
async def delete_bus(id: uuid.UUID, db: DbSession, user: AdminOrSuperAdmin):
    await bus_service.delete_bus(db, id, user.id)
