from pydantic import BaseModel, ConfigDict, Field
import uuid
from typing import Optional
from datetime import datetime
from app.models.enums import BusStatus

class BusBase(BaseModel):
    bus_number: str
    registration_number: str
    capacity: int = Field(..., gt=0)
    is_active: bool = True
    current_status: BusStatus = BusStatus.INACTIVE
    current_route_id: Optional[uuid.UUID] = None

class BusCreate(BusBase):
    pass

class BusUpdate(BaseModel):
    bus_number: Optional[str] = None
    registration_number: Optional[str] = None
    capacity: Optional[int] = Field(None, gt=0)
    is_active: Optional[bool] = None
    current_status: Optional[BusStatus] = None
    current_route_id: Optional[uuid.UUID] = None

class BusResponse(BusBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
