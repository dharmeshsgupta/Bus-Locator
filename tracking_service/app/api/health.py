from fastapi import APIRouter
from app.core.database import get_db
from app.core.redis import get_redis
from fastapi import Depends
from sqlalchemy import text

router = APIRouter()

@router.get("/health")
async def health_check():
    return {"status": "ok"}

@router.get("/ready")
async def readiness_check(
    db=Depends(get_db), 
    redis_client=Depends(get_redis)
):
    try:
        await db.execute(text("SELECT 1"))
        await redis_client.ping()
        return {"status": "ready"}
    except Exception as e:
        return {"status": "unhealthy", "detail": str(e)}

@router.get("/metrics")
async def metrics():
    # Placeholder for Prometheus metrics or custom stats
    return {"status": "ok"}
