from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, health
from app.core.firebase import init_firebase
import logging

# Configure basic logging
logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="BusLocator Auth Service",
    description="Authentication and User Management Microservice",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_origin_regex="https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.models import Base
from app.core.database import engine
from app.api import payment, finance
from sqlalchemy import text

@app.on_event("startup")
async def startup_event():
    init_firebase()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Execute raw SQL ALTER TABLE queries to ensure batch, department, semester columns exist
        try:
            await conn.execute(text("ALTER TABLE students ADD COLUMN IF NOT EXISTS batch VARCHAR(50);"))
            await conn.execute(text("ALTER TABLE students ADD COLUMN IF NOT EXISTS department VARCHAR(100);"))
            await conn.execute(text("ALTER TABLE students ADD COLUMN IF NOT EXISTS semester VARCHAR(20);"))
            logging.info("Ensured batch, department, and semester columns exist in students table.")
        except Exception as e:
            logging.warning(f"Could not run ALTER TABLE: {e}")


# Include routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(payment.router)
app.include_router(finance.router)

