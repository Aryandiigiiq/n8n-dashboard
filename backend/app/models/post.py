from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.base import Base

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(500), nullable=True)                  # optional draft title
    content = Column(Text, nullable=False)
    media_urls = Column(JSON, default=list)  # list of URLs/attachment paths
    platforms = Column(JSON, default=list)   # target platforms, e.g. ["facebook", "instagram"]
    account_ids = Column(JSON, default=list) # target connected Account IDs, e.g. [1, 2]
    status = Column(String(50), default="draft") # draft, ready, scheduled, publishing, published, failed
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    published_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="posts")
    publishing_queue = relationship("PublishingQueue", back_populates="post", cascade="all, delete-orphan")
