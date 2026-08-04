import time
import random
import json
import urllib.request
import urllib.error

AUTH_URL = "http://localhost:8000/auth/admin/login"
TRANSPORT_URL = "http://localhost:8001/api/v1"
TRACKING_URL = "http://localhost:8002/api/v1"

def make_request(url, method="GET", payload=None, headers=None):
    if headers is None:
        headers = {}
    
    data_bytes = None
    if payload is not None:
        data_bytes = json.dumps(payload).encode('utf-8')
        headers["Content-Type"] = "application/json"
        
    req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req, timeout=5.0) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        raise Exception(f"HTTP {e.code}: {body}")
    except Exception as e:
        raise Exception(f"Network error: {str(e)}")

def login():
    """Logs in as admin to get authentication bearer token."""
    print("Logging in to Auth Service...")
    payload = {
        "email": "admin@buslocator.com",
        "password": "admin123"
    }
    resp = make_request(AUTH_URL, method="POST", payload=payload)
    token = resp.get("access_token")
    print("Authentication successful!")
    return token

def get_active_assignments(token):
    """Fetches list of active buses from transport service."""
    headers = {"Authorization": f"Bearer {token}"}
    
    # Fetch buses
    print("Fetching registered buses...")
    buses_resp = make_request(f"{TRANSPORT_URL}/buses", method="GET", headers=headers)
    buses = buses_resp.get("items", [])
    
    active_assignments = []
    for bus in buses:
        if bus.get("is_active") and bus.get("current_route_id"):
            active_assignments.append({
                "bus_id": bus["id"],
                "bus_number": bus["bus_number"],
                "route_id": bus["current_route_id"]
            })
            
    return active_assignments

def simulate():
    token = None
    while not token:
        try:
            token = login()
        except Exception as e:
            print(f"Error logging in (is auth_service running?): {e}")
            time.sleep(5)

    assignments = []
    while not assignments:
        try:
            assignments = get_active_assignments(token)
            if not assignments:
                print("No active buses with assigned routes found. Please assign a route to a bus in the admin panel.")
                time.sleep(5)
        except Exception as e:
            print(f"Error fetching active assignments (is transport_service running?): {e}")
            time.sleep(5)

    print(f"\nStarting simulation for {len(assignments)} active buses...")
    for ass in assignments:
        print(f" - Bus {ass['bus_number']} (ID: {ass['bus_id']}) on Route {ass['route_id']}")

    # Baseline coordinates around campus area
    base_lat = 12.9716
    base_lng = 77.5946
    
    # Track positions of each bus
    bus_positions = {
        ass["bus_id"]: {
            "lat": base_lat + random.uniform(-0.01, 0.01),
            "lng": base_lng + random.uniform(-0.01, 0.01),
            "route_id": ass["route_id"],
            "bus_number": ass["bus_number"]
        }
        for ass in assignments
    }

    headers = {"Authorization": f"Bearer {token}"}

    try:
        while True:
            for bus_id, pos in bus_positions.items():
                # Drift position slightly to simulate bus transit
                pos["lat"] += random.uniform(-0.0002, 0.0002)
                pos["lng"] += random.uniform(-0.0002, 0.0002)
                speed = random.uniform(25.0, 48.0)
                
                payload = {
                    "bus_id": bus_id,
                    "route_id": pos["route_id"],
                    "latitude": pos["lat"],
                    "longitude": pos["lng"],
                    "speed": speed,
                    "accuracy": 1.0
                }
                
                try:
                    make_request(f"{TRACKING_URL}/tracking/location", method="POST", payload=payload, headers=headers)
                    print(f"Broadcast: Bus {pos['bus_number']} -> Coordinates ({pos['lat']:.5f}, {pos['lng']:.5f}) at {speed:.1f} km/h")
                except Exception as e:
                    print(f"Failed to post location for Bus {pos['bus_number']}: {e}")
                    
            time.sleep(3)
    except KeyboardInterrupt:
        print("\nSimulation stopped.")

if __name__ == "__main__":
    simulate()
