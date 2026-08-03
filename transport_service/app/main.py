from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.telemetry import setup_telemetry
from app.core.middleware import RequestIDMiddleware
from app.core.exceptions import global_exception_handler
from app.api.health import router as health_router
from app.api.v1 import routes, stops, buses, assignments, me

from contextlib import asynccontextmanager
from app.models import Base
from app.core.database import engine

setup_telemetry()

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(
    title="BusLocator Transport Service",
    description="Microservice managing Routes, Stops, Buses, and Assignments.",
    version="1.0.0",
    lifespan=lifespan
)

# Exception handlers
from app.core.exceptions import BusinessRuleException, EntityNotFoundException
app.add_exception_handler(Exception, global_exception_handler)
app.add_exception_handler(BusinessRuleException, global_exception_handler)
app.add_exception_handler(EntityNotFoundException, global_exception_handler)

# Middlewares
app.add_middleware(RequestIDMiddleware)
origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
allow_origins = [o for o in origins if o != "*"] + ["https://bus-locator-six.vercel.app", "http://localhost:5173", "http://localhost:3000"]
allow_origin_regex = r"https?://.*"

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health_router)
app.include_router(routes.router, prefix="/api/v1")
app.include_router(stops.router, prefix="/api/v1")
app.include_router(buses.router, prefix="/api/v1")
app.include_router(assignments.router, prefix="/api/v1")
app.include_router(me.router, prefix="/api/v1")
