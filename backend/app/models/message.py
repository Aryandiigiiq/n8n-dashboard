from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.base import Base

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False)
    conversation_id = Column(String(255), nullable=False, index=True)
    platform_message_id = Column(String(255), unique=True, index=True, nullable=False)
    sender_id = Column(String(255), nullable=False)
    sender_name = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)
    is_from_me = Column(Boolean, default=False)
    sent_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="messages")
    account = relationship("Account", back_populates="messages")
