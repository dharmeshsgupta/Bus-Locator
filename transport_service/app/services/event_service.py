from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.event_repository import event_repository
from typing import Dict, Any

class EventService:
    async def publish(self, db: AsyncSession, event_type: str, payload: Dict[str, Any]):
        return await event_repository.publish(db, event_type, payload)

event_service = EventService()
