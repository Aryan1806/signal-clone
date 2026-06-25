from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import insert, update as sa_update
from datetime import datetime
from typing import List
from core.dependencies import get_db, get_current_user
from models.user import User
from models.conversation import Conversation, ConversationParticipant
from models.message import Message, MessageReceipt, MessageReaction
from schemas.message import MessageOut, MessageCreate, MessageStatusUpdate, ReactionCreate

router = APIRouter()


def serialize_message(msg: Message) -> dict:
    sender_data = None
    if msg.sender:
        sender_data = {
            "id": msg.sender.id,
            "display_name": msg.sender.display_name,
            "avatar_url": msg.sender.avatar_url,
        }

    reply_data = None
    if msg.reply_to:
        reply_data = {
            "id": msg.reply_to.id,
            "content": msg.reply_to.content,
            "sender_id": msg.reply_to.sender_id,
            "is_deleted": msg.reply_to.is_deleted,
        }

    reactions_data = [
        {
            "emoji": r.emoji,
            "user_id": r.user_id,
            "user_name": r.user.display_name if r.user else "Unknown",
        }
        for r in (msg.reactions or [])
    ]

    return {
        "id": msg.id,
        "conversation_id": msg.conversation_id,
        "sender_id": msg.sender_id,
        "sender": sender_data,
        "content": msg.content if not msg.is_deleted else None,
        "message_type": msg.message_type,
        "status": msg.status,
        "reply_to": reply_data,
        "reactions": reactions_data,
        "is_deleted": msg.is_deleted,
        "disappears_at": msg.disappears_at.isoformat() if msg.disappears_at else None,
        "created_at": msg.created_at.isoformat(),
        "updated_at": msg.updated_at.isoformat() if msg.updated_at else None,
    }


@router.get("/{conv_id}", response_model=List[dict])
def get_messages(
    conv_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    participation = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conv_id,
        ConversationParticipant.user_id == current_user.id
    ).first()
    if not participation:
        raise HTTPException(status_code=403, detail="Not a participant")

    offset = (page - 1) * limit
    messages = db.query(Message).filter(
        Message.conversation_id == conv_id
    ).order_by(Message.created_at.asc()).offset(offset).limit(limit).all()

    return [serialize_message(m) for m in messages]


@router.post("/{conv_id}", response_model=dict, status_code=201)
async def send_message(
    conv_id: int,
    body: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    participation = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conv_id,
        ConversationParticipant.user_id == current_user.id
    ).first()
    if not participation:
        raise HTTPException(status_code=403, detail="Not a participant")

    msg = Message(
        conversation_id=conv_id,
        sender_id=current_user.id,
        content=body.content,
        message_type=body.message_type or "text",
        status="sent",
        reply_to_id=body.reply_to_id,
    )
    db.add(msg)

    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    conv.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(msg)

    msg_data = serialize_message(msg)

    from routers.websocket import manager
    participants = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conv_id
    ).all()

    for p in participants:
        if p.user_id != current_user.id:
            await manager.send_to_user(p.user_id, {
                "type": "new_message",
                "conversation_id": conv_id,
                "message": msg_data,
            })

    return msg_data


@router.patch("/{message_id}/status")
async def update_message_status(
    message_id: int,
    body: MessageStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    participation = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == msg.conversation_id,
        ConversationParticipant.user_id == current_user.id
    ).first()
    if not participation:
        raise HTTPException(status_code=403, detail="Not a participant")

    msg.status = body.status
    msg.updated_at = datetime.utcnow()

    existing_receipt = db.query(MessageReceipt).filter(
        MessageReceipt.message_id == message_id,
        MessageReceipt.user_id == current_user.id
    ).first()

    if existing_receipt:
        existing_receipt.status = body.status
        existing_receipt.timestamp = datetime.utcnow()
    else:
        receipt = MessageReceipt(
            message_id=message_id,
            user_id=current_user.id,
            status=body.status,
        )
        db.add(receipt)

    db.commit()

    from routers.websocket import manager
    await manager.send_to_user(msg.sender_id, {
        "type": "message_status",
        "message_id": message_id,
        "status": body.status,
        "conversation_id": msg.conversation_id,
    })

    return {"message": "Status updated"}


@router.delete("/{message_id}")
async def delete_message(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    if msg.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot delete other's messages")

    msg.is_deleted = True
    msg.content = None
    db.commit()

    from routers.websocket import manager
    participants = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == msg.conversation_id
    ).all()
    for p in participants:
        if p.user_id != current_user.id:
            await manager.send_to_user(p.user_id, {
                "type": "message_deleted",
                "message_id": message_id,
                "conversation_id": msg.conversation_id,
            })

    return {"message": "Message deleted"}


@router.post("/{message_id}/react")
async def react_to_message(
    message_id: int,
    body: ReactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    existing = db.query(MessageReaction).filter(
        MessageReaction.message_id == message_id,
        MessageReaction.user_id == current_user.id
    ).first()

    if existing:
        if existing.emoji == body.emoji:
            db.delete(existing)
            db.commit()
            action = "removed"
        else:
            existing.emoji = body.emoji
            db.commit()
            action = "updated"
    else:
        reaction = MessageReaction(
            message_id=message_id,
            user_id=current_user.id,
            emoji=body.emoji,
        )
        db.add(reaction)
        db.commit()
        action = "added"

    from routers.websocket import manager
    participants = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == msg.conversation_id
    ).all()
    for p in participants:
        await manager.send_to_user(p.user_id, {
            "type": "reaction",
            "message_id": message_id,
            "user_id": current_user.id,
            "emoji": body.emoji,
            "action": action,
            "conversation_id": msg.conversation_id,
        })

    return {"message": f"Reaction {action}"}
