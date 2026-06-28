from sqlalchemy import String, Integer, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional
from sqlalchemy.dialects.postgresql import UUID
import uuid
from .base import Base, BaseModelMixin
from .enums import BusStatus

class Bus(BaseModelMixin, Base):
    __tablename__ = "buses"

    bus_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    registration_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    capacity: Mapped[int] = mapped_column(Integer)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    current_status: Mapped[BusStatus] = mapped_column(SQLEnum(BusStatus), default=BusStatus.INACTIVE)
    current_route_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("routes.id", ondelete="SET NULL"), nullable=True)

class BusRouteHistory(BaseModelMixin, Base):
    __tablename__ = "bus_route_history"
    
    bus_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("buses.id", ondelete="CASCADE"))
    route_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("routes.id", ondelete="CASCADE"))
    assigned_from: Mapped[Optional[str]] = mapped_column(String(255), nullable=True) # Let's use valid_from from BaseModelMixin created_at
