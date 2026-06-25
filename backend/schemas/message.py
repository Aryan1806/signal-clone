from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from schemas.user import UserOut


class ReactionOut(BaseModel):
    emoji: str
    user_id: int
    user_name: str

    model_config = {"from_attributes": True}


class MessageOut(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    sender: Optional[dict] = None
    content: Optional[str] = None
    message_type: str
    status: str
    reply_to: Optional[dict] = None
    reactions: Optional[List[ReactionOut]] = []
    is_deleted: bool
    disappears_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class MessageCreate(BaseModel):
    content: str
    message_type: Optional[str] = "text"
    reply_to_id: Optional[int] = None


class MessageStatusUpdate(BaseModel):
    status: str


class ReactionCreate(BaseModel):
    emoji: str
