from fastapi import APIRouter, Query
from app.api.dependencies import DbSession, AdminOrSuperAdmin, ActiveUser
from app.schemas.route import RouteCreate, RouteUpdate, RouteResponse, RouteWizardCreate
from app.schemas.common import PageResponse
from app.services.route_service import route_service
import uuid

router = APIRouter(prefix="/routes", tags=["routes"])

@router.post("/wizard", response_model=RouteResponse, status_code=201)
async def create_wizard_route(data: RouteWizardCreate, db: DbSession, user: AdminOrSuperAdmin):
    return await route_service.create_wizard_route(db, data, user.id)

@router.post("/{route_id}/activate-version/{version_id}", status_code=200)
async def activate_version(route_id: uuid.UUID, version_id: uuid.UUID, db: DbSession, user: AdminOrSuperAdmin):
    return await route_service.activate_version(db, route_id, version_id, user.id)

@router.post("/{route_id}/clone", response_model=RouteResponse, status_code=201)
async def clone_route(route_id: uuid.UUID, db: DbSession, user: AdminOrSuperAdmin):
    return await route_service.clone_route(db, route_id, user.id)

@router.post("/{route_id}/draft", status_code=201)
async def create_draft_version(route_id: uuid.UUID, data: RouteWizardCreate, db: DbSession, user: AdminOrSuperAdmin):
    return await route_service.create_draft_version(db, route_id, data, user.id)

@router.post("", response_model=RouteResponse, status_code=201)
async def create_route(data: RouteCreate, db: DbSession, user: AdminOrSuperAdmin):
    return await route_service.create_route(db, data, user.id)

@router.get("", response_model=PageResponse[RouteResponse])
async def get_routes(
    db: DbSession, 
    user: ActiveUser,
    page: int = Query(1, ge=1), 
    page_size: int = Query(20, ge=1, le=100)
):
    skip = (page - 1) * page_size
    items, total = await route_service.get_routes(db, skip=skip, limit=page_size)
    total_pages = (total + page_size - 1) // page_size
    return PageResponse(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)

@router.get("/{id}", response_model=RouteResponse)
async def get_route(id: uuid.UUID, db: DbSession, user: ActiveUser):
    return await route_service.get_route(db, id)

@router.put("/{id}", response_model=RouteResponse)
async def update_route(id: uuid.UUID, data: RouteUpdate, db: DbSession, user: AdminOrSuperAdmin):
    return await route_service.update_route(db, id, data, user.id)

@router.delete("/{id}", status_code=204)
async def delete_route(id: uuid.UUID, db: DbSession, user: AdminOrSuperAdmin):
    await route_service.delete_route(db, id, user.id)
