import logging
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.schemas.media import MediaResponse, MediaAltTextUpdate
from app.services.media_service import MediaService

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/media",
    tags=["Media"]
)


@router.get("", response_model=list[MediaResponse])
def get_media_gallery(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Return all media uploaded by the current user."""
    return MediaService.get_user_media(db, current_user.id)


@router.post("", response_model=MediaResponse, status_code=201)
async def upload_media(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a new media file. Accepts image/* and video/* up to 50 MB."""
    return await MediaService.upload_media(db, file, current_user.id)


@router.get("/{media_id}", response_model=MediaResponse)
def get_media(
    media_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return MediaService.get_media(db, media_id, current_user.id)


@router.patch("/{media_id}/alt-text", response_model=MediaResponse)
def update_alt_text(
    media_id: int,
    data: MediaAltTextUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update the alt text / accessibility label of a media item."""
    return MediaService.update_alt_text(db, media_id, current_user.id, data.alt_text)


@router.delete("/{media_id}", status_code=204)
def delete_media(
    media_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Permanently delete a media item from disk and the database."""
    MediaService.delete_media(db, media_id, current_user.id)
