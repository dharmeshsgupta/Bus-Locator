import redis.asyncio as redis
from typing import AsyncGenerator
from .config import settings

# Global redis connection pool
redis_pool = redis.ConnectionPool.from_url(
    settings.REDIS_URL,
    decode_responses=True
)

# Raw connection for general operations
redis_client = redis.Redis(connection_pool=redis_pool)

async def get_redis() -> AsyncGenerator[redis.Redis, None]:
    # Yield the same client for async requests
    yield redis_client
    
async def close_redis_connection():
    await redis_client.aclose()
    await redis_pool.disconnect()
