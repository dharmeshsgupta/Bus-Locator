from pydantic import BaseModel
import uuid
from .user import UserResponse

class AdminResponse(BaseModel):
    id: uuid.UUID
    user: UserResponse
    is_super_admin: bool

    class Config:
        from_attributes = True
