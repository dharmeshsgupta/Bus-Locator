from pydantic import BaseModel, Field
import uuid

class WaitingUpdate(BaseModel):
    route_id: uuid.UUID
    stop_id: uuid.UUID
    count: int = Field(..., ge=0)
