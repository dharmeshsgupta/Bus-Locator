import pytest
from httpx import AsyncClient
from tests.conftest import get_test_token
import uuid

@pytest.mark.asyncio
async def test_create_assignment(client: AsyncClient):
    token = get_test_token(role="admin")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create Route First
    route_payload = {
        "route_name": "Test Route for Assign",
        "route_code": "R300",
        "start_location": "A",
        "end_location": "B",
        "is_active": True
    }
    route_res = await client.post("/api/v1/routes", json=route_payload, headers=headers)
    route_id = route_res.json()["id"]

    # Create Stop
    stop_payload = {
        "route_id": route_id,
        "stop_name": "Stop Assign",
        "latitude": 23.5,
        "longitude": 72.1,
        "sequence_number": 1,
        "geofence_radius_meters": 50
    }
    stop_res = await client.post("/api/v1/stops", json=stop_payload, headers=headers)
    stop_id = stop_res.json()["id"]

    # Assign student
    student_id = str(uuid.uuid4())
    assign_payload = {
        "student_id": student_id,
        "route_id": route_id,
        "pickup_stop_id": stop_id
    }
    
    response = await client.post("/api/v1/assignments/student", json=assign_payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["pickup_stop_name"] == "Stop Assign"
    assert data["pickup_stop_sequence"] == 1
    assert data["assignment_status"] == "ACTIVE"
    
    # Test ME endpoint
    student_token = get_test_token(role="student")
    # Actually the token payload needs sub = student_id
    from app.core.config import settings
    from jose import jwt
    import datetime
    payload = {
        "sub": student_id,
        "type": "access",
        "role": "student",
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=30)
    }
    student_token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    student_headers = {"Authorization": f"Bearer {student_token}"}

    me_route_res = await client.get("/api/v1/me/route", headers=student_headers)
    assert me_route_res.status_code == 200
    assert me_route_res.json()["route_code"] == "R300"
