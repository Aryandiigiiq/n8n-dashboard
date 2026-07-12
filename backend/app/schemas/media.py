from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class MediaBase(BaseModel):
    filename: str
    original_filename: str
    mime_type: str
    size: int
    url: str
    alt_text: Optional[str] = None


class MediaUploadResponse(BaseModel):
    id: int
    user_id: int
    filename: str
    original_filename: str
    mime_type: str
    size: int
    url: str
    alt_text: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class MediaResponse(MediaUploadResponse):
    pass


class MediaCreate(BaseModel):
    pass  # handled by multipart upload — no body schema needed


class MediaAltTextUpdate(BaseModel):
    alt_text: str
