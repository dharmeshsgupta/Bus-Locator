from sqlalchemy import String, Boolean, Integer, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional, List
from .base import Base, BaseModelMixin
from sqlalchemy.dialects.postgresql import UUID
import uuid

class Route(BaseModelMixin, Base):
    __tablename__ = "routes"

    route_name: Mapped[str] = mapped_column(String(255))
    route_code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    start_location: Mapped[str] = mapped_column(String(255))
    end_location: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    expected_duration_mins: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    average_delay_mins: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    stops = relationship("Stop", back_populates="route", cascade="all, delete-orphan")
    versions = relationship("RouteVersion", back_populates="route", cascade="all, delete-orphan")

class RouteVersion(BaseModelMixin, Base):
    __tablename__ = "route_versions"
    
    route_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("routes.id", ondelete="CASCADE"))
    version_number: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(50), default="DRAFT")
    
    route = relationship("Route", back_populates="versions")
    stops = relationship("StopVersion", back_populates="route_version", cascade="all, delete-orphan")
