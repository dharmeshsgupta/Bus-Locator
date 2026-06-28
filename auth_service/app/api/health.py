from fastapi import APIRouter

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health_check():
    return {"status": "healthy"}

@router.get("/ready")
async def readiness_check():
    # In a real scenario, check DB connection here
    return {"status": "ready"}
