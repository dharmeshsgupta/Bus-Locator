from pydantic import BaseModel, Field
import uuid

class OccupancyUpdate(BaseModel):
    bus_id: uuid.UUID
    occupied: int = Field(..., ge=0)
    available: int = Field(..., ge=0)
