from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from core.dependencies import get_db, get_current_user
from core.security import hash_password, verify_password, create_access_token
from models.user import User
from schemas.auth import RegisterRequest, LoginRequest, AuthResponse
from schemas.user import UserOut

router = APIRouter()

MOCK_OTP = "123456"


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    otp = request.otp or ""
    if otp != MOCK_OTP:
        raise HTTPException(status_code=400, detail="Invalid OTP. Use 123456 for testing.")

    existing = db.query(User).filter(User.phone == request.phone).first()
    if existing:
        raise HTTPException(status_code=409, detail="Phone number already registered.")

    user = User(
        phone=request.phone,
        display_name=request.display_name,
        password_hash=hash_password(request.password),
        about="Hey there! I am using Signal.",
        avatar_url=f"https://api.dicebear.com/7.x/avataaars/svg?seed={request.display_name.replace(' ', '')}",
        is_online=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return AuthResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=AuthResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == request.phone).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user.is_online = True
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return AuthResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.is_online = False
    current_user.last_seen = datetime.utcnow()
    db.commit()
    return {"message": "Logged out successfully"}
