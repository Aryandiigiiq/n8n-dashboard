from pydantic import BaseModel
from datetime import datetime
from typing import Any, Optional

class ScheduleBase(BaseModel):
    post_id: int
    account_id: int
    scheduled_at: datetime
    status: str = "pending"

class ScheduleCreate(ScheduleBase):
    pass

class ScheduleUpdate(BaseModel):
    scheduled_at: Optional[datetime] = None
    status: Optional[str] = None
    published_at: Optional[datetime] = None
    error_message: Optional[str] = None

class ScheduleResponse(ScheduleBase):
    id: int
    published_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
