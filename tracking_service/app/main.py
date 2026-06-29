from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from contextlib import asynccontextmanager
import structlog

from app.core.config import settings
from app.core.telemetry import setup_telemetry
from app.core.middleware import RequestIDMiddleware
from app.core.exceptions import global_exception_handler, TrackingException
from app.core.redis import close_redis_connection
from app.websocket.manager import manager

from app.api.v1.tracking import router as tracking_router
from app.api.v1.occupancy import router as occupancy_router
from app.api.v1.waiting import router as waiting_router
from app.api.v1.eta import router as eta_router
from app.api.health import router as health_router

from app.websocket.tracking_ws import router as tracking_ws_router

setup_telemetry()
logger = structlog.get_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Run Redis Pub/Sub listener in the background
    manager.listener_task = asyncio.create_task(manager.listen_to_redis())
    logger.info("tracking_service_started")
    yield
    # Shutdown
    if manager.listener_task:
        manager.listener_task.cancel()
    await close_redis_connection()
    logger.info("tracking_service_stopped")

app = FastAPI(
    title="BusLocator Tracking Service",
    description="Real-time bus tracking using Redis and WebSockets",
    version="1.0.0",
    lifespan=lifespan
)

# Middleware
app.add_middleware(RequestIDMiddleware)
origins = settings.CORS_ORIGINS.split(",")
if "*" in origins:
    allow_origins = []
    allow_origin_regex = "https?://.*"
else:
    allow_origins = origins
    allow_origin_regex = None

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(TrackingException, global_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

# REST Routers
app.include_router(health_router, tags=["Health"])
app.include_router(tracking_router, prefix="/api/v1/tracking", tags=["Tracking"])
app.include_router(occupancy_router, prefix="/api/v1/occupancy", tags=["Occupancy"])
app.include_router(waiting_router, prefix="/api/v1/waiting", tags=["Waiting"])
app.include_router(eta_router, prefix="/api/v1/eta", tags=["ETA"])

# WebSocket Routers
app.include_router(tracking_ws_router, prefix="/ws/route", tags=["WebSocket Route Events"])
