from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.base import Base

class PostAutomationLink(Base):
    __tablename__ = "post_automation_links"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(String(100), nullable=False)
    automation_id = Column(Integer, ForeignKey("post_automations.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    automation = relationship("PostAutomation")
