from fastapi import APIRouter, Depends
from sqlalchemy import text
from app.api.dependencies import DbSession

router = APIRouter(tags=["health"])

@router.get("/health")
async def health_check():
    return {"status": "healthy"}

@router.get("/ready")
async def readiness_check(db: DbSession):
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception:
        return {"status": "unhealthy", "reason": "database unavailable"}

@router.get("/metrics")
async def metrics():
    # Placeholder for Prometheus metrics
    return {"status": "metrics_endpoint_active"}
