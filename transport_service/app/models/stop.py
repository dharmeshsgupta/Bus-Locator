from sqlalchemy import String, Integer, Float, ForeignKey, UniqueConstraint, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import time
from .base import Base, BaseModelMixin

class Stop(BaseModelMixin, Base):
    __tablename__ = "stops"

    route_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("routes.id", ondelete="CASCADE"))
    stop_name: Mapped[str] = mapped_column(String(255))
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    sequence_number: Mapped[int] = mapped_column(Integer)
    estimated_arrival_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    geofence_radius_meters: Mapped[int] = mapped_column(Integer, default=50)

    route = relationship("Route", back_populates="stops")
    
    __table_args__ = (
        UniqueConstraint("route_id", "sequence_number", name="uq_route_sequence"),
    )

class StopVersion(BaseModelMixin, Base):
    __tablename__ = "stop_versions"
    
    route_version_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("route_versions.id", ondelete="CASCADE"))
    stop_name: Mapped[str] = mapped_column(String(255))
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    sequence_number: Mapped[int] = mapped_column(Integer)
    geofence_radius_meters: Mapped[int] = mapped_column(Integer, default=50)
    estimated_arrival_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    
    route_version = relationship("RouteVersion", back_populates="stops")
