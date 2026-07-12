from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class MessageBase(BaseModel):
    conversation_id: str
    platform_message_id: str
    sender_id: str
    sender_name: Optional[str] = None
    content: str
    is_from_me: bool = False
    sent_at: datetime

class MessageCreate(MessageBase):
    pass

class MessageSend(BaseModel):
    content: str

class MessageResponse(MessageBase):
    id: int
    user_id: int
    account_id: int
    created_at: datetime

    class Config:
        from_attributes = True
