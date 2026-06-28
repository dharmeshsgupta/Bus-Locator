from sqlalchemy import String, ForeignKey, Float, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from typing import Optional
from datetime import datetime
import uuid
from enum import Enum
from .base import Base, BaseModelMixin

class PaymentStatus(str, Enum):
    CREATED = "CREATED"
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    REFUNDED = "REFUNDED"
    EXPIRED = "EXPIRED"

class Payment(BaseModelMixin, Base):
    __tablename__ = "payments"

    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    fee_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("student_fees.id", ondelete="CASCADE"), nullable=False)
    installment_number: Mapped[int] = mapped_column(Integer, nullable=False)
    razorpay_order_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    razorpay_payment_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    razorpay_signature: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR")
    status: Mapped[str] = mapped_column(String(20), default="CREATED")
    gateway: Mapped[str] = mapped_column(String(50), default="RAZORPAY")
    receipt_no: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True)
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    student = relationship("Student", back_populates="payments")
    fee = relationship("StudentFee", back_populates="payments")
    refund = relationship("Refund", back_populates="payment", uselist=False, cascade="all, delete-orphan")

