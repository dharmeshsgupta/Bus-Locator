from typing import Generic, TypeVar, Type, Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
import uuid
from datetime import datetime, timezone
from app.models.base import Base

ModelType = TypeVar("ModelType", bound=Base)

class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model

    async def get(self, db: AsyncSession, id: uuid.UUID) -> Optional[ModelType]:
        query = select(self.model).where(self.model.id == id, self.model.is_deleted == False)
        result = await db.execute(query)
        return result.scalars().first()

    async def get_multi(
        self, db: AsyncSession, *, skip: int = 0, limit: int = 100
    ) -> Tuple[List[ModelType], int]:
        query = select(self.model).where(self.model.is_deleted == False)
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total = await db.scalar(count_query)
        
        # Get paginated items
        items_query = query.offset(skip).limit(limit)
        result = await db.execute(items_query)
        items = list(result.scalars().all())
        
        return items, total

    async def create(self, db: AsyncSession, *, obj_in: dict, created_by: Optional[uuid.UUID] = None) -> ModelType:
        db_obj = self.model(**obj_in)
        if created_by:
            db_obj.created_by = created_by
            db_obj.updated_by = created_by
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self, db: AsyncSession, *, db_obj: ModelType, obj_in: dict, updated_by: Optional[uuid.UUID] = None
    ) -> ModelType:
        for field, value in obj_in.items():
            setattr(db_obj, field, value)
        if updated_by:
            db_obj.updated_by = updated_by
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def soft_delete(self, db: AsyncSession, *, id: uuid.UUID, deleted_by: Optional[uuid.UUID] = None) -> ModelType:
        db_obj = await self.get(db, id)
        if db_obj:
            db_obj.is_deleted = True
            db_obj.deleted_at = datetime.now(timezone.utc)
            if deleted_by:
                db_obj.updated_by = deleted_by
            db.add(db_obj)
            await db.commit()
            await db.refresh(db_obj)
        return db_obj
