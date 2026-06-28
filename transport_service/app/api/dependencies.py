from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_user, CurrentUser, RequireRole
from app.models.enums import UserRole

# Standard dependency injection for database
DbSession = Annotated[AsyncSession, Depends(get_db)]

# Authentication dependencies
ActiveUser = Annotated[CurrentUser, Depends(get_current_user)]

# Role requirements
AdminOrSuperAdmin = Annotated[CurrentUser, Depends(RequireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]))]
SuperAdminOnly = Annotated[CurrentUser, Depends(RequireRole([UserRole.SUPER_ADMIN]))]
StudentOnly = Annotated[CurrentUser, Depends(RequireRole([UserRole.STUDENT]))]
DriverOnly = Annotated[CurrentUser, Depends(RequireRole([UserRole.DRIVER]))]
