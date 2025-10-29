# routers/ws_notification.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
import json
from typing import List, Dict

router = APIRouter()

# Store connected clients with user_id
connected_clients: List[Dict] = []  # [{"user_id": int, "ws": WebSocket}]

@router.websocket("/ws/notifications")
async def websocket_endpoint(websocket: WebSocket, user_id: int = Query(...)):
    """
    WebSocket connection for notifications.
    `user_id` is passed as a query parameter so we know who receives notifications.
    """
    await websocket.accept()
    connected_clients.append({"user_id": user_id, "ws": websocket})
    print(f"🔌 User {user_id} connected! Total clients: {len(connected_clients)}")

    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        # Remove disconnected client
        connected_clients[:] = [c for c in connected_clients if c["ws"] != websocket]
        print(f"❌ User {user_id} disconnected. Remaining: {len(connected_clients)}")

async def broadcast_notification(data: dict, target_user_id: int):
    """
    Send a notification only to the user with target_user_id.
    """
    print(f"📢 Broadcasting to user {target_user_id}: {data}")
    disconnected = []

    for client in connected_clients:
        if client["user_id"] != target_user_id:
            continue
        try:
            await client["ws"].send_text(json.dumps(data))
        except Exception:
            disconnected.append(client)

    # Remove disconnected clients
    for client in disconnected:
        connected_clients.remove(client)
