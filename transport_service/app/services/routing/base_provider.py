from abc import ABC, abstractmethod
from typing import List, Dict, Any, Tuple

class BaseRoutingProvider(ABC):
    @abstractmethod
    async def get_route(self, coordinates: List[Tuple[float, float]]) -> Dict[str, Any]:
        """
        Calculate route between multiple coordinates.
        :param coordinates: List of (longitude, latitude) tuples.
        :return: Dictionary containing 'distance_meters', 'duration_seconds', and 'geometry' (geojson or polyline)
        """
        pass
