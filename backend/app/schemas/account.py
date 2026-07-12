from pydantic import BaseModel
from datetime import datetime
from typing import Any, Optional

class AccountBase(BaseModel):
    platform_id: str
    name: str
    profile_picture: Optional[str] = None
    is_active: bool = True

class AccountCreate(BaseModel):
    integration_id: int
    platform_id: str
    name: str
    profile_picture: Optional[str] = None
    access_token: Optional[str] = None
    metadata_json: Optional[dict[str, Any]] = None

class AccountResponse(AccountBase):
    id: int
    user_id: int
    integration_id: int
    access_token: Optional[str] = None
    metadata_json: Optional[dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
