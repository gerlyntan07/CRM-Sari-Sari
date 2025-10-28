# routers/ws_notification.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import json

router = APIRouter()

# --- Store connected WebSocket clients ---
connected_clients: List[WebSocket] = []

@router.websocket("/ws/notifications")
async def websocket_endpoint(websocket: WebSocket):
    """Handles WebSocket connections for real-time notifications."""
    await websocket.accept()
    connected_clients.append(websocket)
    print("🔌 Client connected! Total clients:", len(connected_clients))

    try:
        while True:
            # Keep connection alive (receive pings, etc.)
            await websocket.receive_text()
    except WebSocketDisconnect:
        connected_clients.remove(websocket)
        print("❌ Client disconnected. Remaining:", len(connected_clients))


async def broadcast_notification(data: dict):
    """Send a message to all connected WebSocket clients."""
    print("📢 Broadcasting to", len(connected_clients), "clients:", data)
    disconnected = []
    for client in connected_clients:
        try:
            await client.send_text(json.dumps(data))
        except Exception:
            disconnected.append(client)

    # Clean up disconnected clients
    for client in disconnected:
        connected_clients.remove(client)
