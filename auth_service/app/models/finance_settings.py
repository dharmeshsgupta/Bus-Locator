from sqlalchemy import String, Float, Integer
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base, BaseModelMixin

class FinanceSettings(BaseModelMixin, Base):
    __tablename__ = "finance_settings"

    grace_period_days: Mapped[int] = mapped_column(Integer, default=5)
    late_fee_percentage: Mapped[float] = mapped_column(Float, default=2.0)
    reminder_frequency_days: Mapped[int] = mapped_column(Integer, default=3)
    gst_percentage: Mapped[float] = mapped_column(Float, default=18.0)
    receipt_prefix: Mapped[str] = mapped_column(String(50), default="REC")
    invoice_prefix: Mapped[str] = mapped_column(String(50), default="INV")
    currency: Mapped[str] = mapped_column(String(10), default="INR")
    timezone: Mapped[str] = mapped_column(String(100), default="Asia/Kolkata")
    academic_year: Mapped[str] = mapped_column(String(50), default="2026-2027")
