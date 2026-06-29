from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.telemetry import setup_telemetry
from app.core.middleware import RequestIDMiddleware
from app.core.exceptions import global_exception_handler
from app.api.health import router as health_router
from app.api.v1 import routes, stops, buses, assignments, me

setup_telemetry()

app = FastAPI(
    title="BusLocator Transport Service",
    description="Microservice managing Routes, Stops, Buses, and Assignments.",
    version="1.0.0"
)

# Exception handlers
from app.core.exceptions import BusinessRuleException, EntityNotFoundException
app.add_exception_handler(Exception, global_exception_handler)
app.add_exception_handler(BusinessRuleException, global_exception_handler)
app.add_exception_handler(EntityNotFoundException, global_exception_handler)

# Middlewares
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

# Routers
app.include_router(health_router)
app.include_router(routes.router, prefix="/api/v1")
app.include_router(stops.router, prefix="/api/v1")
app.include_router(buses.router, prefix="/api/v1")
app.include_router(assignments.router, prefix="/api/v1")
app.include_router(me.router, prefix="/api/v1")
