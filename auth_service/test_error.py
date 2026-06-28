import sys
import uuid
import asyncio
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

res = client.put("/auth/users/c7fe2c1d-b04e-4cb8-8b70-d84bba2b5b72/student", json={
    "name": "Gupta",
    "email": "dharmeshgupta@gmail.com",
    "phone": "08160373866",
    "enrollment_no": "Dharmesh"
})

print("Status:", res.status_code)
print("Response:", res.text)
