from fastapi import Request, status
from fastapi.responses import JSONResponse
import structlog

logger = structlog.get_logger(__name__)

class TrackingException(Exception):
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        self.message = message
        self.status_code = status_code

class EntityNotFoundException(TrackingException):
    def __init__(self, entity: str, id: str):
        super().__init__(f"{entity} with ID {id} not found.", status.HTTP_404_NOT_FOUND)

class BusinessRuleException(TrackingException):
    def __init__(self, message: str):
        super().__init__(message, status.HTTP_422_UNPROCESSABLE_ENTITY)

async def global_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, TrackingException):
        logger.warning("business_rule_violation", detail=exc.message)
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message}
        )
    
    logger.error("unhandled_exception", exc_info=exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal Server Error"}
    )
