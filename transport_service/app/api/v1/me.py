from fastapi import APIRouter
from app.api.dependencies import DbSession, ActiveUser, StudentOnly, DriverOnly
from app.schemas.route import RouteResponse
from app.schemas.bus import BusResponse
from app.schemas.stop import StopResponse
from app.services.assignment_service import assignment_service

router = APIRouter(prefix="/me", tags=["me"])

@router.get("/route", response_model=RouteResponse)
async def get_my_route(db: DbSession, user: StudentOnly):
    return await assignment_service.get_my_route(db, user.id)

@router.get("/stop", response_model=StopResponse)
async def get_my_stop(db: DbSession, user: StudentOnly):
    return await assignment_service.get_my_stop(db, user.id)

@router.get("/bus", response_model=BusResponse)
async def get_my_bus(db: DbSession, user: DriverOnly):
    return await assignment_service.get_my_bus(db, user.id)
