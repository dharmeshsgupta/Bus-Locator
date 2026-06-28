#!/bin/bash
set -e
echo "Running pytest..."
export DATABASE_URL="sqlite+aiosqlite:///./test.db"
export REDIS_URL="redis://localhost:6379/0"
export JWT_SECRET_KEY="testkey"
export JWT_ALGORITHM="HS256"
pytest tests/

echo "Generating Alembic..."
export DATABASE_URL="sqlite+aiosqlite:///./alembic_dummy.db"
alembic revision --autogenerate -m "Initial migration"
rm ./alembic_dummy.db
echo "Done!"
