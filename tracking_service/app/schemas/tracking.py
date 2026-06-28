from pydantic import BaseModel, Field
import uuid

class LocationUpdate(BaseModel):
    bus_id: uuid.UUID
    route_id: uuid.UUID
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    speed: float = Field(default=0, ge=0)
    accuracy: float = Field(default=0, ge=0)

class RouteStateTransition(BaseModel):
    bus_id: uuid.UUID
    route_id: uuid.UUID
    status: str

class EmergencyReport(BaseModel):
    bus_id: uuid.UUID
    route_id: uuid.UUID
    type: str
    message: str

class OccupancyUpdate(BaseModel):
    bus_id: uuid.UUID
    route_id: uuid.UUID
    occupancy_change: int
