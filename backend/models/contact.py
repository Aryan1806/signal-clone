from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    contact_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    nickname = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (UniqueConstraint("owner_id", "contact_id"),)

    owner = relationship("User", foreign_keys=[owner_id], back_populates="contacts_owned")
    contact_user = relationship("User", foreign_keys=[contact_id], back_populates="contacts_as_contact")
