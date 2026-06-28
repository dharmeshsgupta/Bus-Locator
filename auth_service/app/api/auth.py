from fastapi import APIRouter, Depends, HTTPException, status
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt, JWTError
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.config import settings
from app.schemas.auth import TokenResponse, LoginRequest, DriverLoginRequest, SendOTPRequest, VerifyOTPRequest, RefreshTokenRequest
from app.schemas.student import StudentRegisterRequest
from app.schemas.driver import DriverRegisterRequest
from app.schemas.user import UserResponse, StudentUpdateRequest, DriverUpdateRequest
from app.services.auth_service import auth_service
from app.services.otp_service import otp_service
from app.repositories.token_repository import token_repository
from app.repositories.student_repository import student_repository
from app.repositories.driver_repository import driver_repository
from app.api.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/student/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_student(data: StudentRegisterRequest, db: AsyncSession = Depends(get_db)):
    return await auth_service.register_student(db, data)

@router.post("/student/login", response_model=TokenResponse)
async def login_student(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await auth_service.login_student(db, data)

@router.post("/driver/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_driver(data: DriverRegisterRequest, db: AsyncSession = Depends(get_db)):
    # Driver registration assumes OTP was already verified and a flow allowed this
    # In a real app, you might pass a verified OTP token here.
    return await auth_service.register_driver(db, data)

@router.post("/driver/login", response_model=TokenResponse)
async def login_driver(data: DriverLoginRequest, db: AsyncSession = Depends(get_db)):
    return await auth_service.login_driver(db, data)

@router.post("/admin/login", response_model=TokenResponse)
async def login_admin(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await auth_service.login_admin(db, data)

@router.post("/send-otp")
async def send_otp(data: SendOTPRequest, db: AsyncSession = Depends(get_db)):
    # In a real system, verify if phone is registered first if needed
    otp = otp_service.send_otp(data.phone)
    import os
    if os.getenv("ENVIRONMENT", "development") == "development":
        return {"message": "OTP sent successfully", "dev_otp": otp}
    return {"message": "OTP sent successfully"}

@router.post("/verify-otp")
async def verify_otp(data: VerifyOTPRequest):
    if otp_service.verify_otp(data.phone, data.otp):
        return {"message": "OTP verified successfully"}
    raise HTTPException(status_code=400, detail="Invalid or expired OTP")

@router.post("/refresh-token", response_model=TokenResponse)
async def refresh_token(data: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    try:
        payload = jwt.decode(data.refresh_token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
            
        token_record = await token_repository.get_by_token(db, data.refresh_token)
        if not token_record or token_record.is_revoked or token_record.expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="Token is invalid or expired")
            
        from app.repositories.user_repository import user_repository
        user = await user_repository.get_by_id(db, token_record.user_id)
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="User not found or inactive")
            
        # Issue new tokens and revoke old refresh token
        token_record.is_revoked = True
        await db.commit()
        
        return await auth_service._create_tokens_for_user(db, user)
        
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/logout")
async def logout(
    data: RefreshTokenRequest, 
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    token_record = await token_repository.get_by_token(db, data.refresh_token)
    if token_record and token_record.user_id == current_user.id:
        token_record.is_revoked = True
        await db.commit()
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

from typing import List
from app.models.enums import UserRole
from app.repositories.user_repository import user_repository

@router.get("/users", response_model=List[UserResponse])
async def get_users(role: UserRole, db: AsyncSession = Depends(get_db)):
    return await user_repository.get_all_by_role(db, role)

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    user = await user_repository.get_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await user_repository.delete(db, user_id)
    return None

@router.put("/users/{user_id}/student", response_model=UserResponse)
async def update_student(user_id: uuid.UUID, data: StudentUpdateRequest, db: AsyncSession = Depends(get_db)):
    user = await user_repository.get_by_id(db, user_id)
    if not user or user.role != UserRole.STUDENT:
        raise HTTPException(status_code=404, detail="Student not found")
    
    update_data = data.model_dump(exclude_unset=True)
    
    if "name" in update_data: user.name = update_data["name"]
    if "email" in update_data: user.email = update_data["email"]
    if "phone" in update_data: user.phone = update_data["phone"]
    
    if "enrollment_no" in update_data:
        if user.student:
            user.student.enrollment_no = update_data["enrollment_no"]
        else:
            from app.models.student import Student
            new_student = Student(user_id=user.id, enrollment_no=update_data["enrollment_no"])
            await student_repository.create(db, new_student)

    await db.commit()
    return user

@router.put("/users/{user_id}/driver", response_model=UserResponse)
async def update_driver(user_id: uuid.UUID, data: DriverUpdateRequest, db: AsyncSession = Depends(get_db)):
    user = await user_repository.get_by_id(db, user_id)
    if not user or user.role != UserRole.DRIVER:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    update_data = data.model_dump(exclude_unset=True)
    
    if "name" in update_data: user.name = update_data["name"]
    if "phone" in update_data: user.phone = update_data["phone"]
    
    if "license_number" in update_data:
        if user.driver:
            user.driver.license_number = update_data["license_number"]
        else:
            from app.models.driver import Driver
            new_driver = Driver(user_id=user.id, license_number=update_data["license_number"])
            await driver_repository.create(db, new_driver)

    await db.commit()
    return user

