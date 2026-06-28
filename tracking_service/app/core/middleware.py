from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
import uuid
import structlog
from time import time

logger = structlog.get_logger(__name__)

class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            request_id=request_id,
            path=request.url.path,
            method=request.method
        )
        
        start_time = time()
        response = await call_next(request)
        process_time = time() - start_time
        
        logger.info(
            "request_completed",
            status_code=response.status_code,
            duration=process_time
        )
        
        response.headers["X-Request-ID"] = request_id
        return response
