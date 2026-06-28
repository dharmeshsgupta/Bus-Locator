import asyncio
from fastapi import WebSocket
from collections import defaultdict
import structlog
from typing import Dict, Set
import json
from app.core.redis import redis_client

logger = structlog.get_logger(__name__)

class ConnectionManager:
    def __init__(self):
        # Maps "route_id:channel_type" -> set of WebSockets
        self.active_connections: Dict[str, Set[WebSocket]] = defaultdict(set)
        self.pubsub = None
        self.listener_task = None

    async def connect(self, websocket: WebSocket, route_id: str):
        await websocket.accept()
        key = str(route_id)
        self.active_connections[key].add(websocket)
        logger.info("websocket_connected", route_id=route_id)

    def disconnect(self, websocket: WebSocket, route_id: str):
        key = str(route_id)
        if key in self.active_connections and websocket in self.active_connections[key]:
            self.active_connections[key].remove(websocket)
            if not self.active_connections[key]:
                del self.active_connections[key]
            logger.info("websocket_disconnected", route_id=route_id)

    async def broadcast_to_route(self, route_id: str, channel_type: str, message: dict):
        """
        Publishes the message to Redis so ALL worker nodes receive it.
        """
        key = f"{route_id}:{channel_type}"
        wrapped_message = {
            "version": 1,
            "type": channel_type.upper() + "_UPDATE",
            "payload": message
        }
        await redis_client.publish(key, json.dumps(wrapped_message))

    async def _send_to_local_connections(self, channel: str, message: str):
        """
        Sends the message directly to WebSockets connected to this specific worker process.
        """
        # channel format is route_id:channel_type
        route_id = channel.split(":")[0]
        
        # Determine all targets (the specific route and the global admin fleet channel)
        targets = []
        if route_id in self.active_connections:
            targets.extend(list(self.active_connections[route_id]))
        if "GLOBAL" in self.active_connections:
            targets.extend(list(self.active_connections["GLOBAL"]))
            
        for ws in targets:
            try:
                await ws.send_text(message)
            except Exception as e:
                logger.warning("websocket_send_error", error=str(e), route_id=route_id)

    async def listen_to_redis(self):
        """
        Background task to listen to Redis Pub/Sub.
        """
        self.pubsub = redis_client.pubsub()
        # Subscribe to all channels matching pattern: *:location, *:occupancy, *:waiting, *:eta
        await self.pubsub.psubscribe("*:location", "*:occupancy", "*:waiting", "*:eta")
        
        logger.info("redis_pubsub_listener_started")
        
        try:
            async for message in self.pubsub.listen():
                if message["type"] == "pmessage":
                    channel = message["channel"]
                    data = message["data"]
                    await self._send_to_local_connections(channel, data)
        except asyncio.CancelledError:
            logger.info("redis_pubsub_listener_stopped")
        except Exception as e:
            logger.error("redis_pubsub_listener_error", exc_info=e)

manager = ConnectionManager()
