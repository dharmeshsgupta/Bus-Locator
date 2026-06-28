import pytest
from httpx import AsyncClient
from tests.conftest import get_test_token

@pytest.mark.asyncio
async def test_create_bus(client: AsyncClient):
    token = get_test_token(role="admin")
    headers = {"Authorization": f"Bearer {token}"}
    
    payload = {
        "bus_number": "B01",
        "registration_number": "GJ01-1234",
        "capacity": 50,
        "is_active": True,
        "current_status": "ACTIVE"
    }
    
    response = await client.post("/api/v1/buses", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["bus_number"] == "B01"

    # Test GET
    response = await client.get("/api/v1/buses", headers=headers)
    assert response.status_code == 200
    assert response.json()["total"] == 1
