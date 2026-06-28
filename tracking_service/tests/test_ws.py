import pytest
from fastapi.testclient import TestClient
from tests.conftest import app, get_test_token
import uuid

# FastApi TestClient supports synchronous testing of websockets
client = TestClient(app)

def test_websocket_connection():
    route_id = str(uuid.uuid4())
    token = get_test_token(role="student")
    
    with client.websocket_connect(f"/ws/route/{route_id}/location?token={token}") as websocket:
        # Note: In a real environment, the Redis pubsub listener would push messages.
        # Since we mock Redis and aren't pushing real messages through the manager's background task,
        # we just test the connection works and doesn't close immediately.
        assert websocket is not None
