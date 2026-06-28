from sqlalchemy import Integer
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
import uuid
from .base import Base, BaseModelMixin

class OccupancyLog(BaseModelMixin, Base):
    __tablename__ = "occupancy_logs"

    bus_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True)
    occupied_seats: Mapped[int] = mapped_column(Integer, nullable=False)
    available_seats: Mapped[int] = mapped_column(Integer, nullable=False)
