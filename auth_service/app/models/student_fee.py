from sqlalchemy import String, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from typing import Optional
import uuid
from .base import Base, BaseModelMixin

class StudentFee(BaseModelMixin, Base):
    __tablename__ = "student_fees"

    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), unique=True)
    
    installment_1_amount: Mapped[float] = mapped_column(Float, default=0.0)
    installment_1_deadline: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    installment_1_status: Mapped[str] = mapped_column(String(20), default="pending") # 'pending' or 'paid'
    installment_1_payment_date: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    installment_2_amount: Mapped[float] = mapped_column(Float, default=0.0)
    installment_2_deadline: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    installment_2_status: Mapped[str] = mapped_column(String(20), default="pending") # 'pending' or 'paid'
    installment_2_payment_date: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    student = relationship("Student", back_populates="fee_details")
    payments = relationship("Payment", back_populates="fee", cascade="all, delete-orphan")

