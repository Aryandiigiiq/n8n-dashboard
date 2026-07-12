from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class PublishingQueueCreate(BaseModel):
    post_id: int
    account_id: int
    scheduled_at: Optional[datetime] = None


class PublishingQueueResponse(BaseModel):
    id: int
    post_id: int
    account_id: int
    status: str
    scheduled_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    error_message: Optional[str] = None
    platform_response: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
