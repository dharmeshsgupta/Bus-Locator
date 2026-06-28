import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from app.models.route import Route, RouteVersion
from app.models.stop import Stop
from app.models.schedule import RouteSchedule
from app.models.bus import Bus
from sqlalchemy import select

from tests.conftest import get_test_token, TestingSessionLocal

@pytest.mark.asyncio
async def test_route_creation_rollback_on_conflict(client: AsyncClient):
    token = get_test_token(role="admin")
    admin_token_headers = {"Authorization": f"Bearer {token}"}
    
    async with TestingSessionLocal() as db_session:
        # Setup bus
        bus_id = uuid.uuid4()
        bus = Bus(id=bus_id, bus_number="RB-01", registration_number="ROLL-01", capacity=40, created_by=uuid.uuid4(), updated_by=uuid.uuid4())
        db_session.add(bus)
        
        # Setup dummy bus that is ALREADY assigned to cause conflict
        bus2_id = uuid.uuid4()
        bus2 = Bus(id=bus2_id, bus_number="RB-02", registration_number="ROLL-02", capacity=40, current_route_id=uuid.uuid4(), created_by=uuid.uuid4(), updated_by=uuid.uuid4())
        db_session.add(bus2)
        
        await db_session.commit()
    
    route_code = f"ROLLBACK_{uuid.uuid4()}"
    payload = {
        "route": {
            "route_name": "Rollback Test Route",
            "route_code": route_code,
            "start_location": "A",
            "end_location": "B",
            "expected_duration_mins": 30
        },
        "stops": [
            {
                "stop_name": "Stop A",
                "latitude": 1.0,
                "longitude": 1.0,
                "sequence_number": 1,
                "geofence_radius_meters": 50
            },
            {
                "stop_name": "Stop B",
                "latitude": 2.0,
                "longitude": 2.0,
                "sequence_number": 2,
                "geofence_radius_meters": 50
            }
        ],
        "schedules": [
            {
                "start_time": "08:00",
                "end_time": "09:00",
                "recurring_days": [0, 1, 2, 3, 4]
            }
        ],
        "bus_id": str(bus2_id) # This will fail validation
    }
    
    response = await client.post(
        "/api/v1/routes/wizard",
        json=payload,
        headers=admin_token_headers
    )
    
    assert response.status_code == 400
    
    # Verify rollback
    async with TestingSessionLocal() as db_session:
        route = await db_session.scalar(select(Route).where(Route.route_code == route_code))
        assert route is None
        
        stops = await db_session.scalars(select(Stop).where(Stop.stop_name.in_(["Stop A", "Stop B"])))
        assert len(stops.all()) == 0
