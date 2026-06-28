from fastapi import Depends, HTTPException, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from typing import Optional, List
import uuid
from pydantic import BaseModel
from .config import settings

security = HTTPBearer()

class CurrentUser(BaseModel):
    id: uuid.UUID
    role: str

def decode_token(token: str) -> Optional[CurrentUser]:
    try:
        payload = jwt.decode(
            token, 
            settings.JWT_SECRET_KEY, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        if user_id is None or role is None:
            return None
        return CurrentUser(id=uuid.UUID(user_id), role=role)
    except JWTError:
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> CurrentUser:
    token = credentials.credentials
    user = decode_token(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

async def get_current_user_ws(token: str) -> CurrentUser:
    user = decode_token(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

class RequireRole:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    async def __call__(self, user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted for role: {user.role}"
            )
        return user
