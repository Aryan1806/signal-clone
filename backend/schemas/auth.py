from pydantic import BaseModel
from typing import Optional
from schemas.user import UserOut


class RegisterRequest(BaseModel):
    phone: str
    display_name: str
    password: str
    otp: Optional[str] = None


class LoginRequest(BaseModel):
    phone: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
