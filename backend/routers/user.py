from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from models.user import User
from schemas.user import UserCreate, UserRead
from typing import List

router = APIRouter()

# Simple connection manager for WebSocket clients
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)

manager = ConnectionManager()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            # Optionally persist messages to DB here
            await manager.broadcast(data)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@router.post("/messages/", response_model=UserRead)
def post_message(msg: UserCreate, db: Session = Depends(get_db)):
    db_msg = User(**msg.dict())
    db.add(db_msg)
    db.commit()
    db.refresh(db_msg)
    return db_msg

@router.get("/messages/", response_model=List[UserRead])
def get_messages(db: Session = Depends(get_db)):
    return db.query(User).order_by(User.created_at.desc()).limit(50).all()
