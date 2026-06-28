import requests
import sys

try:
    auth_res = requests.post("http://localhost:8000/auth/admin/login", json={"email": "admin@buslocator.com", "password": "admin123"}, timeout=5)
    auth_res.raise_for_status()
    token = auth_res.json().get("access_token")
    if not token:
        raise ValueError("No access token found in response")
    print("TOKEN ACQUIRED")
except Exception as e:
    print("AUTH ERROR:", e)
    sys.exit(1)

try:
    res = requests.get("http://localhost:8001/api/v1/routes", headers={"Authorization": f"Bearer {token}"}, timeout=5)
    print("ROUTES STATUS:", res.status_code)
    print(res.text[:200])
except Exception as e:
    print("ROUTES ERROR:", e)

try:
    res_buses = requests.get("http://localhost:8001/api/v1/buses", headers={"Authorization": f"Bearer {token}"}, timeout=5)
    print("BUSES STATUS:", res_buses.status_code)
    print(res_buses.text[:200])
except Exception as e:
    print("BUSES ERROR:", e)
