from sqlalchemy import Column, Integer, String, ForeignKey
from app.database.base import Base

class PostPlatform(Base):
    __tablename__ = "post_platforms"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    platform = Column(String(50), nullable=False)  # facebook, instagram, linkedin, etc.
