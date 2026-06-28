from pydantic import BaseModel
from typing import Optional
import uuid
from app.models.enums import UserRole

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class LoginRequest(BaseModel):
    email: Optional[str] = None
    enrollment_no: Optional[str] = None
    password: str

class DriverLoginRequest(BaseModel):
    phone: str
    otp: str

class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str

class SendOTPRequest(BaseModel):
    phone: str
