from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.base import Base

class CredentialReference(Base):
    __tablename__ = "credential_references"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    platform = Column(String(50), nullable=False)
    account_id = Column(String(100), nullable=False)
    account_name = Column(String(100), nullable=True)
    page_id = Column(String(100), nullable=True)
    page_access_token = Column(String(1000), nullable=False)
    user_access_token = Column(String(1000), nullable=False)
    expires_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    workspace = relationship("Workspace", back_populates="credentials")
