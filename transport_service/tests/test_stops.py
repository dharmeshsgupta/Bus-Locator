import pytest
from httpx import AsyncClient
from tests.conftest import get_test_token

@pytest.mark.asyncio
async def test_create_stop(client: AsyncClient):
    token = get_test_token(role="admin")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create Route First
    route_payload = {
        "route_name": "Test Route for Stop",
        "route_code": "R200",
        "start_location": "A",
        "end_location": "B",
        "is_active": True
    }
    route_res = await client.post("/api/v1/routes", json=route_payload, headers=headers)
    route_id = route_res.json()["id"]

    # Create Stop
    payload = {
        "route_id": route_id,
        "stop_name": "Stop A",
        "latitude": 23.5,
        "longitude": 72.1,
        "sequence_number": 1,
        "geofence_radius_meters": 50
    }
    
    response = await client.post("/api/v1/stops", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["stop_name"] == "Stop A"

    # Test GET by route
    response = await client.get(f"/api/v1/stops/route/{route_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["total"] == 1
