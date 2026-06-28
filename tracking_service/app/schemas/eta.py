from pydantic import BaseModel, Field
import uuid

class EtaUpdate(BaseModel):
    route_id: uuid.UUID
    stop_id: uuid.UUID
    eta_minutes: int = Field(..., ge=0)
