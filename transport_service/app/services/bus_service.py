from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.bus_repository import bus_repository
from app.repositories.route_repository import route_repository
from app.schemas.bus import BusCreate, BusUpdate
from app.models.bus import Bus
from app.core.exceptions import EntityNotFoundException, BusinessRuleException
from app.services.event_service import event_service
import uuid

class BusService:
    async def create_bus(self, db: AsyncSession, data: BusCreate, user_id: uuid.UUID) -> Bus:
        if await bus_repository.get_by_registration(db, data.registration_number):
            raise BusinessRuleException("Registration number already in use.")
        if await bus_repository.get_by_bus_number(db, data.bus_number):
            raise BusinessRuleException("Bus number already in use.")
            
        if data.current_route_id:
            route = await route_repository.get(db, data.current_route_id)
            if not route:
                raise EntityNotFoundException("Route", str(data.current_route_id))
                
        bus = await bus_repository.create(db, obj_in=data.model_dump(), created_by=user_id)
        await event_service.publish(db, "BUS_CREATED", {"bus_id": str(bus.id)})
        return bus

    async def get_bus(self, db: AsyncSession, id: uuid.UUID) -> Bus:
        bus = await bus_repository.get(db, id)
        if not bus:
            raise EntityNotFoundException("Bus", str(id))
        return bus

    async def get_buses(self, db: AsyncSession, skip: int, limit: int):
        return await bus_repository.get_multi(db, skip=skip, limit=limit)

    async def update_bus(self, db: AsyncSession, id: uuid.UUID, data: BusUpdate, user_id: uuid.UUID) -> Bus:
        bus = await self.get_bus(db, id)
        updated = await bus_repository.update(db, db_obj=bus, obj_in=data.model_dump(exclude_unset=True), updated_by=user_id)
        await event_service.publish(db, "BUS_UPDATED", {"bus_id": str(updated.id)})
        return updated

    async def delete_bus(self, db: AsyncSession, id: uuid.UUID, user_id: uuid.UUID):
        await self.get_bus(db, id)
        await bus_repository.soft_delete(db, id=id, deleted_by=user_id)
        await event_service.publish(db, "BUS_DELETED", {"bus_id": str(id)})

bus_service = BusService()
