from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token
from app.repositories.user_repository import user_repository
from app.repositories.student_repository import student_repository
from app.repositories.driver_repository import driver_repository
from app.repositories.token_repository import token_repository
from app.services.firebase_service import firebase_service
from app.services.otp_service import otp_service
from app.models.user import User
from app.models.student import Student
from app.models.driver import Driver
from app.models.token import RefreshToken
from app.models.enums import UserRole
from app.schemas.student import StudentRegisterRequest
from app.schemas.driver import DriverRegisterRequest
from app.schemas.auth import LoginRequest, DriverLoginRequest, TokenResponse
from app.core.config import settings
from datetime import datetime, timezone, timedelta

class AuthService:
    
    async def register_student(self, db: AsyncSession, data: StudentRegisterRequest):
        # Check if email, phone or enrollment exists
        if await user_repository.get_by_email(db, data.email):
            raise HTTPException(status_code=400, detail="Email already registered")
        if await user_repository.get_by_phone(db, data.phone):
            raise HTTPException(status_code=400, detail="Phone already registered")
        if await student_repository.get_by_enrollment_no(db, data.enrollment_no):
            raise HTTPException(status_code=400, detail="Enrollment number already registered")

        # Create Firebase User
        firebase_uid = firebase_service.create_user(email=data.email, password=data.password)

        # Create User
        user = User(
            firebase_uid=firebase_uid,
            role=UserRole.STUDENT,
            name=data.name,
            email=data.email,
            phone=data.phone,
            password_hash=get_password_hash(data.password),
            is_active=True,
            is_verified=True # Auto-verify for now
        )
        await user_repository.create(db, user)

        # Create Student
        student = Student(
            user_id=user.id,
            enrollment_no=data.enrollment_no
        )
        await student_repository.create(db, student)

        return await self._create_tokens_for_user(db, user)

    async def login_student(self, db: AsyncSession, data: LoginRequest):
        user = None
        if data.email:
            user = await user_repository.get_by_email(db, data.email)
        elif data.enrollment_no:
            student = await student_repository.get_by_enrollment_no(db, data.enrollment_no)
            if student:
                user = await user_repository.get_by_id(db, student.user_id)

        if not user or user.role != UserRole.STUDENT:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        if not verify_password(data.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        return await self._create_tokens_for_user(db, user)

    async def register_driver(self, db: AsyncSession, data: DriverRegisterRequest):
        if await user_repository.get_by_phone(db, data.phone):
            raise HTTPException(status_code=400, detail="Phone already registered")

        # OTP is assumed to be verified before calling this
        firebase_uid = firebase_service.create_user(phone=data.phone)

        user = User(
            firebase_uid=firebase_uid,
            role=UserRole.DRIVER,
            name=data.name,
            phone=data.phone,
            is_active=True,
            is_verified=True
        )
        await user_repository.create(db, user)

        driver = Driver(user_id=user.id)
        await driver_repository.create(db, driver)

        return await self._create_tokens_for_user(db, user)

    async def login_driver(self, db: AsyncSession, data: DriverLoginRequest):
        if not otp_service.verify_otp(data.phone, data.otp):
            raise HTTPException(status_code=401, detail="Invalid OTP")

        user = await user_repository.get_by_phone(db, data.phone)
        if not user or user.role != UserRole.DRIVER:
            raise HTTPException(status_code=404, detail="Driver not found")

        return await self._create_tokens_for_user(db, user)

    async def login_admin(self, db: AsyncSession, data: LoginRequest):
        if not data.email:
            raise HTTPException(status_code=400, detail="Email required for admin login")

        user = await user_repository.get_by_email(db, data.email)
        if not user or user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            raise HTTPException(status_code=401, detail="Invalid credentials or not an admin")

        if not verify_password(data.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        return await self._create_tokens_for_user(db, user)

    async def _create_tokens_for_user(self, db: AsyncSession, user: User) -> TokenResponse:
        access_token = create_access_token(subject=user.id, role=user.role.value)
        refresh_token_str = create_refresh_token(subject=user.id)

        # Store refresh token
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        refresh_token = RefreshToken(
            user_id=user.id,
            token=refresh_token_str,
            expires_at=expires_at
        )
        await token_repository.create(db, refresh_token)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token_str
        )

auth_service = AuthService()
