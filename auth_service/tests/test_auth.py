import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

@pytest.mark.asyncio
async def test_student_register(client: AsyncClient):
    payload = {
        "enrollment_no": "22CE001",
        "name": "Dharmesh Gupta",
        "email": "dharmesh@example.com",
        "phone": "9876543210",
        "password": "password123"
    }
    # Mocking firebase_service to not actually hit Firebase during tests
    from app.services.firebase_service import firebase_service
    firebase_service.create_user = lambda **kwargs: "mocked_firebase_uid"
    
    response = await client.post("/auth/student/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data

@pytest.mark.asyncio
async def test_student_login(client: AsyncClient):
    # Register first
    payload = {
        "enrollment_no": "22CE002",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "phone": "9876543211",
        "password": "password123"
    }
    from app.services.firebase_service import firebase_service
    firebase_service.create_user = lambda **kwargs: "mocked_firebase_uid_2"
    
    await client.post("/auth/student/register", json=payload)

    # Login
    login_payload = {
        "email": "jane@example.com",
        "password": "password123"
    }
    response = await client.post("/auth/student/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data

    # Verify /me endpoint
    headers = {"Authorization": f"Bearer {data['access_token']}"}
    me_res = await client.get("/auth/me", headers=headers)
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["email"] == "jane@example.com"
    assert me_data["role"] == "student"
