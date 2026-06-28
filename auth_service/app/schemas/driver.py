from pydantic import BaseModel
import uuid
from .user import UserResponse

class DriverRegisterRequest(BaseModel):
    phone: str
    name: str

class DriverResponse(BaseModel):
    id: uuid.UUID
    user: UserResponse

    class Config:
        from_attributes = True
