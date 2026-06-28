from sqlalchemy import String, Integer, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import DateTime
from typing import Optional
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from .base import Base, BaseModelMixin
from .enums import AssignmentStatus

class StudentAssignment(BaseModelMixin, Base):
    __tablename__ = "student_assignments"

    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True)
    route_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("routes.id", ondelete="CASCADE"))
    pickup_stop_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("stops.id", ondelete="CASCADE"))
    
    # Snapshot fields
    pickup_stop_name: Mapped[str] = mapped_column(String(255))
    pickup_stop_sequence: Mapped[int] = mapped_column(Integer)
    
    assignment_status: Mapped[AssignmentStatus] = mapped_column(SQLEnum(AssignmentStatus), default=AssignmentStatus.ACTIVE)
    valid_from: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    valid_to: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

class DriverAssignment(BaseModelMixin, Base):
    __tablename__ = "driver_assignments"

    driver_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True)
    bus_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("buses.id", ondelete="CASCADE"))
    
    assignment_status: Mapped[AssignmentStatus] = mapped_column(SQLEnum(AssignmentStatus), default=AssignmentStatus.ACTIVE)
    valid_from: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    valid_to: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
