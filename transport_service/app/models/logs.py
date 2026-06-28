from sqlalchemy import Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid
from .base import Base, BaseModelMixin

class OccupancyLog(BaseModelMixin, Base):
    __tablename__ = "occupancy_logs"

    bus_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("buses.id", ondelete="CASCADE"), index=True)
    occupancy: Mapped[int] = mapped_column(Integer)
