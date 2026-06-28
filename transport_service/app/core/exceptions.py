from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
import structlog

logger = structlog.get_logger(__name__)

class BusinessRuleException(Exception):
    def __init__(self, detail: str, status_code: int = 400):
        self.detail = detail
        self.status_code = status_code

class EntityNotFoundException(Exception):
    def __init__(self, entity_name: str, entity_id: str):
        self.detail = f"{entity_name} with id {entity_id} not found"
        self.status_code = 404

async def global_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, EntityNotFoundException):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
    if isinstance(exc, BusinessRuleException):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
        
    logger.error("Unhandled exception", exc_info=exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
