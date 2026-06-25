from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
from core.dependencies import get_db, get_current_user
from models.user import User
from models.conversation import Conversation, ConversationParticipant
from models.group import Group
from models.message import Message
from schemas.conversation import ParticipantOut, GroupUpdate, AddMemberRequest
from schemas.user import UserOut

router = APIRouter()


def check_admin(conv_id: int, user_id: int, db: Session):
    part = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conv_id,
        ConversationParticipant.user_id == user_id
    ).first()
    if not part:
        raise HTTPException(status_code=403, detail="Not a participant")
    if part.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return part


@router.get("/{conv_id}/members", response_model=List[ParticipantOut])
def get_members(
    conv_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    part = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conv_id,
        ConversationParticipant.user_id == current_user.id
    ).first()
    if not part:
        raise HTTPException(status_code=403, detail="Not a participant")

    participants = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conv_id
    ).all()

    return [
        ParticipantOut(
            user_id=p.user_id,
            user=UserOut.model_validate(p.user),
            role=p.role,
            joined_at=p.joined_at,
        )
        for p in participants
    ]


@router.post("/{conv_id}/members")
async def add_member(
    conv_id: int,
    body: AddMemberRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_admin(conv_id, current_user.id, db)

    user_to_add = db.query(User).filter(User.id == body.user_id).first()
    if not user_to_add:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conv_id,
        ConversationParticipant.user_id == body.user_id
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="User already in group")

    new_part = ConversationParticipant(
        conversation_id=conv_id,
        user_id=body.user_id,
        role="member",
    )
    db.add(new_part)

    system_msg = Message(
        conversation_id=conv_id,
        sender_id=current_user.id,
        content=f"{user_to_add.display_name} was added to the group",
        message_type="system",
        status="sent",
    )
    db.add(system_msg)
    db.commit()

    from routers.websocket import manager
    all_parts = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conv_id
    ).all()
    for p in all_parts:
        await manager.send_to_user(p.user_id, {
            "type": "group_member_added",
            "conversation_id": conv_id,
            "user_id": body.user_id,
        })

    return {"message": "Member added"}


@router.delete("/{conv_id}/members/{user_id}")
async def remove_member(
    conv_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_admin(conv_id, current_user.id, db)

    user_to_remove = db.query(User).filter(User.id == user_id).first()
    if not user_to_remove:
        raise HTTPException(status_code=404, detail="User not found")

    part = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conv_id,
        ConversationParticipant.user_id == user_id
    ).first()
    if not part:
        raise HTTPException(status_code=404, detail="User not in group")

    db.delete(part)

    system_msg = Message(
        conversation_id=conv_id,
        sender_id=current_user.id,
        content=f"{user_to_remove.display_name} was removed from the group",
        message_type="system",
        status="sent",
    )
    db.add(system_msg)
    db.commit()

    from routers.websocket import manager
    all_parts = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conv_id
    ).all()
    for p in all_parts:
        await manager.send_to_user(p.user_id, {
            "type": "group_member_removed",
            "conversation_id": conv_id,
            "user_id": user_id,
        })

    return {"message": "Member removed"}


@router.patch("/{conv_id}")
async def update_group(
    conv_id: int,
    body: GroupUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_admin(conv_id, current_user.id, db)

    group = db.query(Group).filter(Group.conversation_id == conv_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    if body.name is not None:
        group.name = body.name
    if body.description is not None:
        group.description = body.description
    if body.avatar_url is not None:
        group.avatar_url = body.avatar_url

    db.commit()
    db.refresh(group)

    from routers.websocket import manager
    all_parts = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conv_id
    ).all()
    for p in all_parts:
        await manager.send_to_user(p.user_id, {
            "type": "group_updated",
            "conversation_id": conv_id,
        })

    return {"message": "Group updated"}
