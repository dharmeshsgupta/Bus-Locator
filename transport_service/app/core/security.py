from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from typing import List
import uuid

from app.core.config import settings

security = HTTPBearer()

class CurrentUser:
    def __init__(self, user_id: uuid.UUID, role: str):
        self.id = user_id
        self.role = role

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> CurrentUser:
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Stateless JWT validation
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id_str: str = payload.get("sub")
        token_type: str = payload.get("type")
        # Ensure we decode the role (assuming Auth service encodes it in token. If not, this is a placeholder. 
        # Actually, standard auth service issues token without role inside payload. Let's assume auth service is updated to put role in payload, OR we assume transport service knows the role? 
        # The user requested stateless validation including verifying "user role". Thus, Auth service MUST include role in JWT. We'll extract it here.)
        role: str = payload.get("role", "student") # Default to student if missing for fallback
        
        if user_id_str is None or token_type != "access":
            raise credentials_exception
            
        return CurrentUser(user_id=uuid.UUID(user_id_str), role=role)
    except (JWTError, ValueError):
        raise credentials_exception

class RequireRole:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        return current_user
