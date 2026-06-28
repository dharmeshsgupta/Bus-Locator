import httpx
from typing import List, Dict, Any, Tuple
from .base_provider import BaseRoutingProvider

class OSRMProvider(BaseRoutingProvider):
    def __init__(self):
        self.base_url = "https://router.project-osrm.org/route/v1/driving"

    async def get_route(self, coordinates: List[Tuple[float, float]]) -> Dict[str, Any]:
        if len(coordinates) < 2:
            return {"distance_meters": 0, "duration_seconds": 0, "geometry": None}

        # OSRM expects coordinates in lon,lat format separated by semicolons
        coord_string = ";".join([f"{lon},{lat}" for lon, lat in coordinates])
        url = f"{self.base_url}/{coord_string}?overview=full&geometries=geojson"

        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            if response.status_code == 200:
                data = response.json()
                if data.get("code") == "Ok" and len(data.get("routes", [])) > 0:
                    route = data["routes"][0]
                    return {
                        "distance_meters": route.get("distance", 0),
                        "duration_seconds": route.get("duration", 0),
                        "geometry": route.get("geometry", {})
                    }
        
        return {"distance_meters": 0, "duration_seconds": 0, "geometry": None}
