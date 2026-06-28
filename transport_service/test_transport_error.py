import asyncio
from fastapi.testclient import TestClient
from app.main import app
import uuid

client = TestClient(app)

res = client.get("/api/v1/assignments/drivers/me", headers={"x-user-id": str(uuid.uuid4()), "x-user-role": "driver"})
print("Status:", res.status_code)
print("Response:", res.text)
