import pytest
from fastapi.testclient import TestClient
from tests.conftest import fastapi_app, get_test_token
import uuid

# FastApi TestClient supports synchronous testing of websockets
client = TestClient(fastapi_app)

def test_websocket_connection():
    route_id = str(uuid.uuid4())
    token = get_test_token(role="student")
    
    with client.websocket_connect(f"/ws/route/{route_id}?token={token}") as websocket:
        websocket.send_text("ping")
        assert websocket is not None
