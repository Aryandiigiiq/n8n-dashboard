from pydantic import BaseModel
from datetime import datetime
from typing import Any, Optional

class IntegrationBase(BaseModel):
    provider: str
    is_active: bool = True

class IntegrationCreate(BaseModel):
    provider: str
    credentials: dict[str, Any]

class IntegrationResponse(IntegrationBase):
    id: int
    user_id: int
    credentials: dict[str, Any]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
