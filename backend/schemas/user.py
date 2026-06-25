from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class UserOut(BaseModel):
    id: int
    phone: str
    username: Optional[str] = None
    display_name: str
    avatar_url: Optional[str] = None
    about: Optional[str] = None
    is_online: bool
    last_seen: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    about: Optional[str] = None
    avatar_url: Optional[str] = None
    username: Optional[str] = None
