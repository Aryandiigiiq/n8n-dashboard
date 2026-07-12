from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.base import Base

class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    integration_id = Column(Integer, ForeignKey("integrations.id", ondelete="CASCADE"), nullable=False)
    platform_id = Column(String(255), nullable=False)  # external Platform ID (e.g. Page ID)
    name = Column(String(255), nullable=False)
    profile_picture = Column(String(500), nullable=True)
    access_token = Column(String(500), nullable=True)  # page specific access token
    is_active = Column(Boolean, default=True)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    integration = relationship("Integration", back_populates="accounts")
    user = relationship("User", back_populates="accounts")
    messages = relationship("Message", back_populates="account", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="account", cascade="all, delete-orphan")
