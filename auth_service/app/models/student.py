from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from typing import Optional
import uuid
from .base import Base, BaseModelMixin

class Student(BaseModelMixin, Base):
    __tablename__ = "students"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    enrollment_no: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    
    # Future-proof fields
    address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    pickup_stop_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    route_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    id_card_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    batch: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    semester: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    user = relationship("User", back_populates="student")
    fee_details = relationship("StudentFee", back_populates="student", uselist=False, lazy="selectin", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="student", cascade="all, delete-orphan")
    refunds = relationship("Refund", back_populates="student", cascade="all, delete-orphan")


