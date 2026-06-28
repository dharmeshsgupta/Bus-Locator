import asyncio
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.models.enums import UserRole
import uuid

async def seed_admin():
    async with SessionLocal() as db:
        # Check if admin already exists
        from sqlalchemy import select
        result = await db.execute(select(User).where(User.email == "admin@buslocator.com"))
        existing_admin = result.scalar_one_or_none()
        
        if existing_admin:
            print("Admin user already exists.")
            return

        # Create admin
        admin = User(
            firebase_uid=str(uuid.uuid4()), # Mock firebase UID for seed
            role=UserRole.ADMIN,
            name="System Admin",
            email="admin@buslocator.com",
            phone="+1234567890",
            password_hash=get_password_hash("admin123"),
            is_active=True,
            is_verified=True
        )
        db.add(admin)
        await db.commit()
        print("✅ Seeded Admin User:")
        print("   Email: admin@buslocator.com")
        print("   Password: admin123")
        print("   Contact: +1234567890")

if __name__ == "__main__":
    print("Seeding database...")
    asyncio.run(seed_admin())
