from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.websocket.manager import manager
from app.core.security import get_current_user_ws
import structlog

logger = structlog.get_logger(__name__)

router = APIRouter()

@router.websocket("/fleet")
async def websocket_fleet(websocket: WebSocket, token: str = Query(...)):
    user = await get_current_user_ws(token)
    # Require admin role (or at least check)
    if user.role not in ["admin", "superadmin"]:
        await websocket.close(code=1008, reason="Unauthorized")
        return
        
    await manager.connect(websocket, "GLOBAL")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, "GLOBAL")
    except Exception as e:
        logger.error("ws_fleet_error", error=str(e))
        manager.disconnect(websocket, "GLOBAL")

@router.websocket("/{route_id}")
async def websocket_route(websocket: WebSocket, route_id: str, token: str = Query(...)):
    user = await get_current_user_ws(token)
    await manager.connect(websocket, route_id)
    try:
        while True:
            # We don't expect messages from students to the broadcast channel,
            # but we must listen to keep the connection open and handle disconnects.
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, route_id)
    except Exception as e:
        logger.error("ws_route_error", error=str(e))
        manager.disconnect(websocket, route_id)
