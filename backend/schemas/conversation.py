from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from schemas.user import UserOut


class GroupOut(BaseModel):
    id: int
    conversation_id: int
    name: str
    description: Optional[str] = None
    avatar_url: Optional[str] = None
    created_by: int
    member_count: Optional[int] = 0
    created_at: datetime

    model_config = {"from_attributes": True}


class LastMessagePreview(BaseModel):
    content: Optional[str] = None
    sender_name: str
    created_at: datetime
    message_type: str


class ParticipantOut(BaseModel):
    user_id: int
    user: UserOut
    role: str
    joined_at: datetime

    model_config = {"from_attributes": True}


class ConversationOut(BaseModel):
    id: int
    type: str
    other_user: Optional[UserOut] = None
    group: Optional[GroupOut] = None
    last_message: Optional[LastMessagePreview] = None
    unread_count: int = 0
    updated_at: datetime
    participants: Optional[List[ParticipantOut]] = None

    model_config = {"from_attributes": True}


class DirectConversationCreate(BaseModel):
    contact_id: int


class GroupConversationCreate(BaseModel):
    name: str
    member_ids: List[int]
    description: Optional[str] = None
    avatar_url: Optional[str] = None


class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    avatar_url: Optional[str] = None


class AddMemberRequest(BaseModel):
    user_id: int
