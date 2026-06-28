from pydantic import BaseModel, EmailStr, Field
from typing import Optional
import uuid
from .user import UserResponse

class StudentRegisterRequest(BaseModel):
    enrollment_no: str
    name: str
    email: EmailStr
    phone: str
    password: str = Field(..., min_length=6)

class StudentResponse(BaseModel):
    id: uuid.UUID
    enrollment_no: str
    user: UserResponse
    address: Optional[str] = None
    pickup_stop_id: Optional[str] = None
    route_id: Optional[str] = None
    id_card_number: Optional[str] = None

    class Config:
        from_attributes = True
