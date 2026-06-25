from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from core.dependencies import get_db, get_current_user
from models.user import User
from models.contact import Contact
from schemas.user import UserOut, UserUpdate
from typing import List, Optional

router = APIRouter()


@router.get("/contacts", response_model=List[UserOut])
def get_contacts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return all contacts for the current user, sorted by display name."""
    contacts = (
        db.query(User)
        .join(Contact, Contact.contact_id == User.id)
        .filter(Contact.owner_id == current_user.id)
        .order_by(User.display_name)
        .all()
    )
    return contacts


@router.get("/search", response_model=List[UserOut])
def search_users(
    q: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search users by phone number or display name (case-insensitive)."""
    results = db.query(User).filter(
        User.id != current_user.id,
        (User.phone.ilike(f"%{q}%")) | (User.display_name.ilike(f"%{q}%"))
    ).limit(20).all()
    return results


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserOut)
def update_me(
    update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if update.display_name is not None:
        current_user.display_name = update.display_name
    if update.about is not None:
        current_user.about = update.about
    if update.avatar_url is not None:
        current_user.avatar_url = update.avatar_url
    if update.username is not None:
        existing = db.query(User).filter(
            User.username == update.username,
            User.id != current_user.id
        ).first()
        if existing:
            raise HTTPException(status_code=409, detail="Username already taken")
        current_user.username = update.username
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
