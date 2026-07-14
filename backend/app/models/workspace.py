from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.base import Base

class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    owner = relationship("User", back_populates="workspaces")
    automations = relationship("PostAutomation", back_populates="workspace", cascade="all, delete-orphan")
    executions = relationship("WorkflowExecution", back_populates="workspace", cascade="all, delete-orphan")
    credentials = relationship("CredentialReference", back_populates="workspace", cascade="all, delete-orphan")
