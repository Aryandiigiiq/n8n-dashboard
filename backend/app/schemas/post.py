from pydantic import BaseModel
from datetime import datetime
from typing import Any, Optional


class PostBase(BaseModel):
    content: str
    title: Optional[str] = None
    media_urls: list[str] = []
    platforms: list[str] = []
    account_ids: list[int] = []
    status: str = "draft"
    scheduled_at: Optional[datetime] = None


class PostCreate(PostBase):
    pass


class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    media_urls: Optional[list[str]] = None
    platforms: Optional[list[str]] = None
    account_ids: Optional[list[int]] = None
    status: Optional[str] = None
    scheduled_at: Optional[datetime] = None


class PostResponse(PostBase):
    id: int
    user_id: int
    published_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PostPreviewData(BaseModel):
    """Data used for the live preview panel"""
    id: int
    title: Optional[str] = None
    content: str
    media_urls: list[str]
    platforms: list[str]
    account_ids: list[int]
    status: str
    scheduled_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CalendarEvent(BaseModel):
    """Calendar view event — one entry per scheduled post"""
    post_id: int
    title: Optional[str] = None
    content_preview: str
    platforms: list[str]
    account_ids: list[int]
    scheduled_at: datetime
    status: str
