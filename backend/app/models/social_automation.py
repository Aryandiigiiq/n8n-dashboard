from sqlalchemy.sql import func
from app.database.base import Base
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, JSON

class SocialAutomation(Base):
    __tablename__ = "social_automations"

    id = Column(Integer, primary_key=True, index=True)
    platform_name = Column(String(50), nullable=False)
    post_id = Column(String(100), unique=True, nullable=False, index=True)
    
    automation_enabled = Column(Boolean, default=True, nullable=False)
    keywords = Column(JSON, default=list, nullable=False) # Store keywords array
    match_type = Column(String(50), default="contains", nullable=False)
    ignore_case = Column(Boolean, default=True, nullable=False)
    
    reply_enabled = Column(Boolean, default=True, nullable=False)
    dm_enabled = Column(Boolean, default=True, nullable=False)
    
    reply_template = Column(Text, nullable=True)
    dm_template = Column(Text, nullable=True)
    
    reply_delay = Column(Integer, default=0, nullable=False) # Seconds
    expires_at = Column(DateTime(timezone=True), nullable=True) # Nullable expiry
    
    campaign_name = Column(String(100), nullable=True)
    created_by = Column(String(100), nullable=True)
    updated_by = Column(String(100), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


