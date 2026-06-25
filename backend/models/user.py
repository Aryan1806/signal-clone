from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    phone = Column(String, unique=True, nullable=False)
    username = Column(String, unique=True, nullable=True)
    display_name = Column(String, nullable=False)
    avatar_url = Column(Text, nullable=True)
    about = Column(Text, default="Hey there! I am using Signal.")
    password_hash = Column(String, nullable=False)
    is_online = Column(Boolean, default=False)
    last_seen = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    contacts_owned = relationship("Contact", foreign_keys="Contact.owner_id", back_populates="owner", cascade="all, delete-orphan")
    contacts_as_contact = relationship("Contact", foreign_keys="Contact.contact_id", back_populates="contact_user", cascade="all, delete-orphan")
    conversation_participations = relationship("ConversationParticipant", back_populates="user", cascade="all, delete-orphan")
    messages_sent = relationship("Message", back_populates="sender", cascade="all, delete-orphan")
    reactions = relationship("MessageReaction", back_populates="user", cascade="all, delete-orphan")
    receipts = relationship("MessageReceipt", back_populates="user", cascade="all, delete-orphan")
