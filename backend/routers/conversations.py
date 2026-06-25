from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import List, Optional
from core.dependencies import get_db, get_current_user
from models.user import User
from models.conversation import Conversation, ConversationParticipant
from models.group import Group
from models.message import Message
from schemas.conversation import (
    ConversationOut, DirectConversationCreate, GroupConversationCreate,
    GroupOut, LastMessagePreview, ParticipantOut
)
from schemas.user import UserOut

router = APIRouter()


def build_conversation_out(conv: Conversation, current_user_id: int, db: Session) -> ConversationOut:
    participants = conv.participants

    other_user = None
    group_out = None

    if conv.type == "direct":
        for p in participants:
            if p.user_id != current_user_id:
                other_user = UserOut.model_validate(p.user)
                break
    else:
        if conv.group:
            member_count = len(participants)
            group_out = GroupOut(
                id=conv.group.id,
                conversation_id=conv.group.conversation_id,
                name=conv.group.name,
                description=conv.group.description,
                avatar_url=conv.group.avatar_url,
                created_by=conv.group.created_by,
                member_count=member_count,
                created_at=conv.group.created_at,
            )

    last_msg = db.query(Message).filter(
        Message.conversation_id == conv.id,
        Message.is_deleted == False
    ).order_by(Message.created_at.desc()).first()

    last_message = None
    if last_msg:
        last_message = LastMessagePreview(
            content=(last_msg.content or "")[:60],
            sender_name=last_msg.sender.display_name if last_msg.sender else "Unknown",
            created_at=last_msg.created_at,
            message_type=last_msg.message_type,
        )

    my_participant = next((p for p in participants if p.user_id == current_user_id), None)
    last_read_at = my_participant.last_read_at if my_participant else None

    unread_count = 0
    if last_read_at:
        unread_count = db.query(func.count(Message.id)).filter(
            Message.conversation_id == conv.id,
            Message.sender_id != current_user_id,
            Message.created_at > last_read_at,
            Message.is_deleted == False
        ).scalar() or 0
    else:
        unread_count = db.query(func.count(Message.id)).filter(
            Message.conversation_id == conv.id,
            Message.sender_id != current_user_id,
            Message.is_deleted == False
        ).scalar() or 0

    parts_out = [
        ParticipantOut(
            user_id=p.user_id,
            user=UserOut.model_validate(p.user),
            role=p.role,
            joined_at=p.joined_at,
        )
        for p in participants
    ]

    return ConversationOut(
        id=conv.id,
        type=conv.type,
        other_user=other_user,
        group=group_out,
        last_message=last_message,
        unread_count=unread_count,
        updated_at=conv.updated_at,
        participants=parts_out,
    )


@router.get("", response_model=List[ConversationOut])
def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    participations = db.query(ConversationParticipant).filter(
        ConversationParticipant.user_id == current_user.id
    ).all()

    conv_ids = [p.conversation_id for p in participations]

    conversations = db.query(Conversation).filter(
        Conversation.id.in_(conv_ids)
    ).order_by(Conversation.updated_at.desc()).all()

    result = []
    for conv in conversations:
        result.append(build_conversation_out(conv, current_user.id, db))

    return result


@router.post("/direct", response_model=ConversationOut, status_code=201)
def create_direct_conversation(
    body: DirectConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contact = db.query(User).filter(User.id == body.contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="User not found")

    my_convs = db.query(ConversationParticipant).filter(
        ConversationParticipant.user_id == current_user.id
    ).all()
    my_conv_ids = [p.conversation_id for p in my_convs]

    existing = db.query(Conversation).filter(
        Conversation.id.in_(my_conv_ids),
        Conversation.type == "direct"
    ).join(ConversationParticipant, Conversation.id == ConversationParticipant.conversation_id).filter(
        ConversationParticipant.user_id == body.contact_id
    ).first()

    if existing:
        return build_conversation_out(existing, current_user.id, db)

    conv = Conversation(type="direct", updated_at=datetime.utcnow())
    db.add(conv)
    db.flush()

    p1 = ConversationParticipant(conversation_id=conv.id, user_id=current_user.id, role="member")
    p2 = ConversationParticipant(conversation_id=conv.id, user_id=body.contact_id, role="member")
    db.add_all([p1, p2])
    db.commit()
    db.refresh(conv)

    return build_conversation_out(conv, current_user.id, db)


@router.post("/group", response_model=ConversationOut, status_code=201)
def create_group_conversation(
    body: GroupConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = Conversation(type="group", updated_at=datetime.utcnow())
    db.add(conv)
    db.flush()

    admin_part = ConversationParticipant(conversation_id=conv.id, user_id=current_user.id, role="admin")
    db.add(admin_part)

    for uid in body.member_ids:
        if uid != current_user.id:
            member_part = ConversationParticipant(conversation_id=conv.id, user_id=uid, role="member")
            db.add(member_part)

    avatar = body.avatar_url or f"https://api.dicebear.com/7.x/initials/svg?seed={body.name.replace(' ', '+')}"
    group = Group(
        conversation_id=conv.id,
        name=body.name,
        description=body.description,
        avatar_url=avatar,
        created_by=current_user.id,
    )
    db.add(group)

    system_msg = Message(
        conversation_id=conv.id,
        sender_id=current_user.id,
        content=f"{current_user.display_name} created this group",
        message_type="system",
        status="sent",
    )
    db.add(system_msg)
    db.commit()
    db.refresh(conv)

    return build_conversation_out(conv, current_user.id, db)


@router.get("/{conv_id}", response_model=ConversationOut)
def get_conversation(
    conv_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    participation = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conv_id,
        ConversationParticipant.user_id == current_user.id
    ).first()

    if not participation:
        raise HTTPException(status_code=403, detail="Not a participant")

    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return build_conversation_out(conv, current_user.id, db)


@router.patch("/{conv_id}/read")
def mark_conversation_read(
    conv_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    participation = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conv_id,
        ConversationParticipant.user_id == current_user.id
    ).first()

    if not participation:
        raise HTTPException(status_code=403, detail="Not a participant")

    participation.last_read_at = datetime.utcnow()
    db.commit()
    return {"message": "Marked as read"}
