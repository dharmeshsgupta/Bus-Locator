import sys
import uuid
import asyncio
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

res = client.put("/auth/users/c7fe2c1d-b04e-4cb8-8b70-d84bba2b5b72/driver", json={
    "name": "Gupta",
    "phone": "08160373866",
    "license_number": "Dharmesh"
})

print("Status:", res.status_code)
print("Response:", res.text)
