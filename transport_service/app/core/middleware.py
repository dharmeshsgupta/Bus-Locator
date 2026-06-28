import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
import structlog

class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Bind request_id to structlog thread-local/contextvars
        structlog.contextvars.bind_contextvars(request_id=request_id)
        
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        
        structlog.contextvars.clear_contextvars()
        return response
