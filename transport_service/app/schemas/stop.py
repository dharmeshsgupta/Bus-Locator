from pydantic import BaseModel, ConfigDict, Field
import uuid
from typing import Optional
from datetime import time, datetime

class StopBase(BaseModel):
    route_id: uuid.UUID
    stop_name: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    sequence_number: int
    estimated_arrival_time: Optional[time] = None
    geofence_radius_meters: int = 50

class StopCreate(StopBase):
    pass

class StopCreateInline(BaseModel):
    stop_name: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    sequence_number: int
    estimated_arrival_time: Optional[time] = None
    geofence_radius_meters: int = 50

class StopUpdate(BaseModel):
    stop_name: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    sequence_number: Optional[int] = None
    estimated_arrival_time: Optional[time] = None
    geofence_radius_meters: Optional[int] = None

class StopResponse(StopBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
