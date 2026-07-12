from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.base import Base

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="SET NULL"), nullable=True)
    platform_post_id = Column(String(255), nullable=False, index=True)
    platform_comment_id = Column(String(255), unique=True, index=True, nullable=False)
    parent_id = Column(String(255), nullable=True)
    sender_id = Column(String(255), nullable=False)
    sender_name = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)
    is_hidden = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    is_from_me = Column(Boolean, default=False)
    sent_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="comments")
    account = relationship("Account", back_populates="comments")
    post = relationship("Post")
