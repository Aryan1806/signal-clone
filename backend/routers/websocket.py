from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict
from database import SessionLocal
from core.security import decode_token
from models.user import User
from models.conversation import ConversationParticipant
from models.contact import Contact

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.is_online = True
                db.commit()
        finally:
            db.close()

    def disconnect(self, user_id: int):
        self.active_connections.pop(user_id, None)
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.is_online = False
                user.last_seen = datetime.utcnow()
                db.commit()
        finally:
            db.close()

    async def send_to_user(self, user_id: int, message: dict):
        ws = self.active_connections.get(user_id)
        if ws:
            try:
                await ws.send_json(message)
            except Exception:
                self.active_connections.pop(user_id, None)

    async def broadcast_to_conversation(self, conv_id: int, message: dict, exclude_user_id: int, db: Session):
        participants = db.query(ConversationParticipant).filter(
            ConversationParticipant.conversation_id == conv_id
        ).all()
        for p in participants:
            if p.user_id != exclude_user_id:
                await self.send_to_user(p.user_id, message)

    async def broadcast_user_status(self, user_id: int, is_online: bool, last_seen=None, db: Session = None):
        if db is None:
            return
        contacts = db.query(Contact).filter(Contact.contact_id == user_id).all()
        for c in contacts:
            await self.send_to_user(c.owner_id, {
                "type": "user_status",
                "user_id": user_id,
                "is_online": is_online,
                "last_seen": last_seen.isoformat() if last_seen else None,
            })


manager = ConnectionManager()


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: int,
    token: str = Query(...)
):
    try:
        decoded_user_id = decode_token(token)
        if decoded_user_id != user_id:
            await websocket.close(code=4001)
            return
    except Exception:
        await websocket.close(code=4001)
        return

    await manager.connect(websocket, user_id)

    db = SessionLocal()
    try:
        await manager.broadcast_user_status(user_id, True, db=db)
    finally:
        db.close()

    try:
        while True:
            data = await websocket.receive_json()
            event_type = data.get("type")

            if event_type == "typing":
                conv_id = data.get("conversation_id")
                db = SessionLocal()
                try:
                    user = db.query(User).filter(User.id == user_id).first()
                    user_name = user.display_name if user else "Unknown"
                    await manager.broadcast_to_conversation(conv_id, {
                        "type": "typing",
                        "conversation_id": conv_id,
                        "user_id": user_id,
                        "user_name": user_name,
                    }, exclude_user_id=user_id, db=db)
                finally:
                    db.close()

            elif event_type == "stop_typing":
                conv_id = data.get("conversation_id")
                db = SessionLocal()
                try:
                    await manager.broadcast_to_conversation(conv_id, {
                        "type": "stop_typing",
                        "conversation_id": conv_id,
                        "user_id": user_id,
                    }, exclude_user_id=user_id, db=db)
                finally:
                    db.close()

            elif event_type == "mark_read":
                conv_id = data.get("conversation_id")
                message_id = data.get("message_id")
                db = SessionLocal()
                try:
                    from models.message import Message, MessageReceipt
                    from models.conversation import ConversationParticipant

                    part = db.query(ConversationParticipant).filter(
                        ConversationParticipant.conversation_id == conv_id,
                        ConversationParticipant.user_id == user_id
                    ).first()
                    if part:
                        part.last_read_at = datetime.utcnow()

                    if message_id:
                        msg = db.query(Message).filter(Message.id == message_id).first()
                        if msg and msg.sender_id != user_id:
                            existing = db.query(MessageReceipt).filter(
                                MessageReceipt.message_id == message_id,
                                MessageReceipt.user_id == user_id
                            ).first()
                            if not existing:
                                receipt = MessageReceipt(
                                    message_id=message_id,
                                    user_id=user_id,
                                    status="read",
                                )
                                db.add(receipt)
                            msg.status = "read"
                            db.commit()

                            await manager.send_to_user(msg.sender_id, {
                                "type": "message_status",
                                "message_id": message_id,
                                "status": "read",
                                "conversation_id": conv_id,
                            })
                    else:
                        db.commit()
                finally:
                    db.close()

    except WebSocketDisconnect:
        manager.disconnect(user_id)
        db = SessionLocal()
        try:
            now = datetime.utcnow()
            await manager.broadcast_user_status(user_id, False, last_seen=now, db=db)
        finally:
            db.close()
    except Exception:
        manager.disconnect(user_id)
