from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.stop_repository import stop_repository
from app.repositories.route_repository import route_repository
from app.schemas.stop import StopCreate, StopUpdate
from app.models.stop import Stop
from app.core.exceptions import EntityNotFoundException, BusinessRuleException
from app.services.event_service import event_service
import uuid

class StopService:
    async def create_stop(self, db: AsyncSession, data: StopCreate, user_id: uuid.UUID) -> Stop:
        route = await route_repository.get(db, data.route_id)
        if not route:
            raise EntityNotFoundException("Route", str(data.route_id))
            
        existing_seq = await stop_repository.get_by_sequence(db, data.route_id, data.sequence_number)
        if existing_seq:
            raise BusinessRuleException(f"Sequence number {data.sequence_number} already exists on this route.")
            
        stop = await stop_repository.create(db, obj_in=data.model_dump(), created_by=user_id)
        await event_service.publish(db, "STOP_CREATED", {"stop_id": str(stop.id), "route_id": str(stop.route_id)})
        return stop

    async def get_stop(self, db: AsyncSession, id: uuid.UUID) -> Stop:
        stop = await stop_repository.get(db, id)
        if not stop:
            raise EntityNotFoundException("Stop", str(id))
        return stop

    async def get_stops_by_route(self, db: AsyncSession, route_id: uuid.UUID, skip: int, limit: int):
        return await stop_repository.get_by_route(db, route_id, skip=skip, limit=limit)

    async def update_stop(self, db: AsyncSession, id: uuid.UUID, data: StopUpdate, user_id: uuid.UUID) -> Stop:
        stop = await self.get_stop(db, id)
        updated = await stop_repository.update(db, db_obj=stop, obj_in=data.model_dump(exclude_unset=True), updated_by=user_id)
        await event_service.publish(db, "STOP_UPDATED", {"stop_id": str(updated.id)})
        return updated

    async def delete_stop(self, db: AsyncSession, id: uuid.UUID, user_id: uuid.UUID):
        await self.get_stop(db, id)
        await stop_repository.soft_delete(db, id=id, deleted_by=user_id)
        await event_service.publish(db, "STOP_DELETED", {"stop_id": str(id)})

stop_service = StopService()
