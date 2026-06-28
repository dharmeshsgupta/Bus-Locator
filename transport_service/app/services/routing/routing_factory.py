import os
from .base_provider import BaseRoutingProvider
from .osrm_provider import OSRMProvider

class RoutingFactory:
    @staticmethod
    def get_provider() -> BaseRoutingProvider:
        provider_name = os.getenv("ROUTING_PROVIDER", "OSRM")
        if provider_name == "OSRM":
            return OSRMProvider()
        # Add other providers here when implemented
        return OSRMProvider()

routing_provider = RoutingFactory.get_provider()
