import pytest
from httpx import AsyncClient, ASGITransport
from tests.conftest import app, get_test_token
import uuid

@pytest.mark.asyncio
async def test_update_location():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        token = get_test_token(role="driver")
        bus_id = str(uuid.uuid4())
        route_id = str(uuid.uuid4())
        
        payload = {
            "bus_id": bus_id,
            "route_id": route_id,
            "latitude": 21.0,
            "longitude": 72.0,
            "speed": 35
        }
        
        res = await client.post("/api/v1/tracking/location", json=payload, headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        assert res.json()["status"] == "success"
        
        # Test GET live location
        student_token = get_test_token(role="student")
        res2 = await client.get(f"/api/v1/tracking/bus/{bus_id}", headers={"Authorization": f"Bearer {student_token}"})
        assert res2.status_code == 200
        data = res2.json()
        assert data["lat"] == 21.0
        assert data["lng"] == 72.0
        assert data["speed"] == 35

@pytest.mark.asyncio
async def test_update_occupancy():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        token = get_test_token(role="driver")
        bus_id = str(uuid.uuid4())
        route_id = str(uuid.uuid4())
        
        payload = {
            "bus_id": bus_id,
            "route_id": route_id,
            "occupied": 40,
            "available": 10
        }
        
        res = await client.post("/api/v1/occupancy/update", json=payload, headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        assert res.json()["status"] == "success"
        
        student_token = get_test_token(role="student")
        res2 = await client.get(f"/api/v1/occupancy/bus/{bus_id}", headers={"Authorization": f"Bearer {student_token}"})
        assert res2.status_code == 200
        data = res2.json()
        assert data["occupied"] == 40
        assert data["available"] == 10
