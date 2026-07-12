from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class CommentBase(BaseModel):
    platform_post_id: str
    platform_comment_id: str
    parent_id: Optional[str] = None
    sender_id: str
    sender_name: Optional[str] = None
    content: str
    is_hidden: bool = False
    is_deleted: bool = False
    is_from_me: bool = False
    sent_at: datetime

class CommentCreate(CommentBase):
    post_id: Optional[int] = None

class CommentReply(BaseModel):
    content: str

class CommentResponse(CommentBase):
    id: int
    user_id: int
    account_id: int
    post_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True
