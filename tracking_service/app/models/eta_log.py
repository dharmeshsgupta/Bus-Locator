from sqlalchemy import Integer
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
import uuid
from .base import Base, BaseModelMixin

class EtaLog(BaseModelMixin, Base):
    __tablename__ = "eta_logs"

    route_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True)
    stop_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True)
    eta_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
