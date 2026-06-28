from pydantic import BaseModel, ConfigDict
import uuid
from typing import Optional
from datetime import datetime

class RouteBase(BaseModel):
    route_name: str
    route_code: str
    start_location: str
    end_location: str
    is_active: bool = True
    expected_duration_mins: Optional[int] = None
    average_delay_mins: Optional[float] = None

class RouteCreate(RouteBase):
    pass

from app.schemas.stop import StopCreateInline

class RouteScheduleCreate(BaseModel):
    start_time: str
    end_time: str
    recurring_days: list[int]

class RouteCompleteCreate(BaseModel):
    route: RouteCreate
    stops: list[StopCreateInline]
    schedules: list[RouteScheduleCreate] = []
    bus_id: Optional[uuid.UUID] = None
    driver_id: Optional[uuid.UUID] = None

class RouteWizardCreate(RouteCompleteCreate):
    pass

class RouteUpdate(BaseModel):
    route_name: Optional[str] = None
    route_code: Optional[str] = None
    start_location: Optional[str] = None
    end_location: Optional[str] = None
    is_active: Optional[bool] = None
    expected_duration_mins: Optional[int] = None
    average_delay_mins: Optional[float] = None

class RouteResponse(RouteBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
