import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from httpx import AsyncClient, ASGITransport
import sys
import os
import uuid
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app as fastapi_app
from app.core.database import get_db
from app.models import Base
from app.core.redis import get_redis

# Using aiosqlite for tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestingSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

async def override_get_db():
    async with TestingSessionLocal() as session:
        yield session

import fakeredis.aioredis
mock_redis = fakeredis.aioredis.FakeRedis(decode_responses=True)

import app.websocket.manager
import app.core.redis
import app.services.tracking_service
import app.services.occupancy_service

app.websocket.manager.redis_client = mock_redis
app.core.redis.redis_client = mock_redis
app.services.tracking_service.redis_client = mock_redis
app.services.occupancy_service.redis_client = mock_redis

async def override_get_redis():
    yield mock_redis

fastapi_app.dependency_overrides[get_db] = override_get_db
fastapi_app.dependency_overrides[get_redis] = override_get_redis

@pytest_asyncio.fixture(scope="function", autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await mock_redis.flushall()

def get_test_token(role: str = "driver") -> str:
    from jose import jwt
    from app.core.config import settings
    return jwt.encode({"sub": str(uuid.uuid4()), "role": role}, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
