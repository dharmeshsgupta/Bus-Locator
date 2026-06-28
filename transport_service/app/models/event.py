from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.types import JSON
from .base import Base, BaseModelMixin

class DomainEvent(BaseModelMixin, Base):
    __tablename__ = "domain_events"

    event_type: Mapped[str] = mapped_column(String(255), index=True)
    payload: Mapped[dict] = mapped_column(JSON().with_variant(JSONB, 'postgresql'))
    processed: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
