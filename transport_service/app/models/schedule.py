from sqlalchemy import String, Integer, ForeignKey, Time, JSON, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import uuid
from datetime import time
from .base import Base, BaseModelMixin
import enum

class DayOfWeek(int, enum.Enum):
    MONDAY = 0
    TUESDAY = 1
    WEDNESDAY = 2
    THURSDAY = 3
    FRIDAY = 4
    SATURDAY = 5
    SUNDAY = 6

class RouteSchedule(BaseModelMixin, Base):
    __tablename__ = "route_schedules"

    route_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("routes.id", ondelete="CASCADE"))
    start_time: Mapped[time] = mapped_column(Time)
    end_time: Mapped[time] = mapped_column(Time)
    recurring_days: Mapped[list[int]] = mapped_column(JSON) # List of DayOfWeek values
    
    route = relationship("Route", backref="schedules")
