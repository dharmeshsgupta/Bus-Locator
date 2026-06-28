from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import uuid
from app.models.enums import UserRole

class UserBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None

class StudentProfileBase(BaseModel):
    enrollment_no: str

    class Config:
        from_attributes = True

class DriverProfileBase(BaseModel):
    license_number: Optional[str] = None

    class Config:
        from_attributes = True

class StudentUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    enrollment_no: Optional[str] = None

class DriverUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    license_number: Optional[str] = None

class UserResponse(UserBase):
    id: uuid.UUID
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    
    student: Optional[StudentProfileBase] = None
    driver: Optional[DriverProfileBase] = None

    class Config:
        from_attributes = True
