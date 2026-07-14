from sqlalchemy import Column, Integer, String, ForeignKey, JSON, DateTime, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.base import Base

class PostAutomation(Base):
    __tablename__ = "post_automations"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    
    post_id = Column(String(100), nullable=False)
    permalink = Column(String(500), nullable=False)
    platform = Column(String(50), nullable=False)  # instagram, facebook, threads
    post_thumbnail = Column(String(500), nullable=True)
    post_caption = Column(String(1000), nullable=True)
    media_type = Column(String(50), nullable=True)
    timestamp = Column(DateTime(timezone=True), nullable=True)
    like_count = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)
    owner_username = Column(String(100), nullable=True)
    
    n8n_workflow_id = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=False)
    visual_graph = Column(JSON, nullable=False)  # { "nodes": [], "edges": [] }
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    workspace = relationship("Workspace", back_populates="automations")
    executions = relationship("WorkflowExecution", back_populates="automation", cascade="all, delete-orphan")
