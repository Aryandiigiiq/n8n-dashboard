from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.base import Base


class PublishingQueue(Base):
    """
    Represents a single publishing job that is ready-to-publish.
    Each job maps one Post to one Account. The mock publish service
    exposes the same interface that the real platform publishers will use.
    """
    __tablename__ = "publishing_queue"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False)

    # Status flow: queued → publishing → completed | failed
    status = Column(String(50), default="queued", nullable=False)

    # When to attempt publishing (may be immediate for manual trigger)
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    published_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)

    # Platform-specific response payload (post ID, permalink, etc.)
    platform_response = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    post = relationship("Post", back_populates="publishing_queue")
    account = relationship("Account")
