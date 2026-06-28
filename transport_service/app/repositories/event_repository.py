from sqlalchemy.ext.asyncio import AsyncSession
from app.models.event import DomainEvent
from typing import Dict, Any

class EventRepository:
    async def publish(self, db: AsyncSession, event_type: str, payload: Dict[str, Any]) -> DomainEvent:
        db_obj = DomainEvent(event_type=event_type, payload=payload)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

event_repository = EventRepository()
