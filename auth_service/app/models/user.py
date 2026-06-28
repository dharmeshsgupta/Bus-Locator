from sqlalchemy import String, Boolean, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional
from .base import Base, BaseModelMixin
from .enums import UserRole

class User(BaseModelMixin, Base):
    __tablename__ = "users"

    firebase_uid: Mapped[Optional[str]] = mapped_column(String(128), unique=True, index=True, nullable=True)
    role: Mapped[UserRole] = mapped_column(SQLEnum(UserRole), index=True)
    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[Optional[str]] = mapped_column(String(255), unique=True, index=True, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), unique=True, index=True, nullable=True)
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    
    student = relationship("Student", back_populates="user", uselist=False, lazy="selectin", cascade="all, delete-orphan")
    driver = relationship("Driver", back_populates="user", uselist=False, lazy="selectin", cascade="all, delete-orphan")
    admin = relationship("Admin", back_populates="user", uselist=False, lazy="selectin", cascade="all, delete-orphan")
    tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
