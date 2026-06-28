import pytest
from httpx import AsyncClient
from tests.conftest import get_test_token

@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_create_route(client: AsyncClient):
    token = get_test_token(role="admin")
    headers = {"Authorization": f"Bearer {token}"}
    
    payload = {
        "route_name": "Test Route",
        "route_code": "R100",
        "start_location": "A",
        "end_location": "B",
        "is_active": True
    }
    
    response = await client.post("/api/v1/routes", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["route_code"] == "R100"

    # Test GET
    response = await client.get("/api/v1/routes", headers=headers)
    assert response.status_code == 200
    assert response.json()["total"] == 1
