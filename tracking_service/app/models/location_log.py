from sqlalchemy import Float, Integer
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
import uuid
from .base import Base, BaseModelMixin

class LocationLog(BaseModelMixin, Base):
    __tablename__ = "location_logs"

    bus_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    speed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
