from pydantic import BaseModel, ConfigDict
import uuid
from typing import Optional
from datetime import datetime
from app.models.enums import AssignmentStatus

class StudentAssignmentCreate(BaseModel):
    student_id: uuid.UUID
    route_id: uuid.UUID
    pickup_stop_id: uuid.UUID

class StudentAssignmentResponse(BaseModel):
    id: uuid.UUID
    student_id: uuid.UUID
    route_id: uuid.UUID
    pickup_stop_id: uuid.UUID
    pickup_stop_name: str
    pickup_stop_sequence: int
    assignment_status: AssignmentStatus
    valid_from: datetime
    valid_to: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class DriverAssignmentCreate(BaseModel):
    driver_id: uuid.UUID
    bus_id: uuid.UUID

class DriverAssignmentResponse(BaseModel):
    id: uuid.UUID
    driver_id: uuid.UUID
    bus_id: uuid.UUID
    assignment_status: AssignmentStatus
    valid_from: datetime
    valid_to: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
