import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import SessionLocal
from app.services.assignment_service import assignment_service
import uuid

async def main():
    async with SessionLocal() as db:
        # Assuming the driver ID is c7fe2c1d-b04e-4cb8-8b70-d84bba2b5b72 (from earlier test)
        driver_id = uuid.UUID("c7fe2c1d-b04e-4cb8-8b70-d84bba2b5b72")
        try:
            res = await assignment_service.get_driver_full_assignment(db, driver_id)
            print("SUCCESS:", res)
        except Exception as e:
            print("ERROR:", str(e))

asyncio.run(main())
