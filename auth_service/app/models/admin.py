from sqlalchemy import Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from .base import Base, BaseModelMixin

class Admin(BaseModelMixin, Base):
    __tablename__ = "admins"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    is_super_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    
    user = relationship("User", back_populates="admin")
