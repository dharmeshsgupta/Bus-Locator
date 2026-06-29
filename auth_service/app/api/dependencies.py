from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import uuid

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.models.enums import UserRole
from app.repositories.user_repository import user_repository

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id_str: str = payload.get("sub")
        token_type: str = payload.get("type")
        if user_id_str is None or token_type != "access":
            with open("auth_debug.log", "a") as f:
                f.write(f"Validation failed: sub={user_id_str}, type={token_type}\n")
            raise credentials_exception
        user_id = uuid.UUID(user_id_str)
    except Exception as e:
        with open("auth_debug.log", "a") as f:
            f.write(f"JWT decode error: {type(e).__name__} - {str(e)} - Token prefix: {token[:25]}...\n")
        raise credentials_exception
        
    user = await user_repository.get_by_id(db, user_id)
    if user is None:
        with open("auth_debug.log", "a") as f:
            f.write(f"User not found in DB: ID={user_id}\n")
        raise credentials_exception
    if not user.is_active:
        with open("auth_debug.log", "a") as f:
            f.write(f"User inactive in DB: ID={user_id}\n")
        raise credentials_exception
        
    with open("auth_debug.log", "a") as f:
        f.write(f"User successfully validated: ID={user_id}, Name={user.name}, Role={user.role}\n")
    return user

async def get_current_student(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user

async def get_current_driver(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.DRIVER:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user

async def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user

async def get_current_super_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user
