import os
import shutil
import uuid
import logging
from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.models.media import Media

logger = logging.getLogger(__name__)

UPLOAD_DIR = "uploads"
ALLOWED_MIME_TYPES = {
    "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp",
    "video/mp4", "video/quicktime", "video/mpeg", "video/webm"
}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".mov", ".mpeg", ".webm"}
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB


class MediaService:

    @staticmethod
    def ensure_upload_dir() -> None:
        os.makedirs(UPLOAD_DIR, exist_ok=True)

    @staticmethod
    async def upload_media(db: Session, file: UploadFile, user_id: int) -> Media:
        """Validate, persist to disk, and record media in database."""
        MediaService.ensure_upload_dir()

        # Validate extension
        if not file.filename:
            raise HTTPException(status_code=400, detail="File must have a filename")

        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file extension '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )

        # Read file content to check size
        content = await file.read()
        size = len(content)

        if size == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")
        if size > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"File too large ({size // 1024 // 1024}MB). Maximum allowed: 50MB"
            )

        # Generate unique filename
        unique_name = f"{uuid.uuid4().hex}{ext}"
        storage_path = os.path.join(UPLOAD_DIR, unique_name)
        serving_url = f"/static/{unique_name}"

        # Write to disk
        try:
            with open(storage_path, "wb") as f:
                f.write(content)
        except OSError as e:
            logger.error(f"Failed to write media file to disk: {e}")
            raise HTTPException(status_code=500, detail="Failed to save uploaded file")

        # Determine mime type
        mime_type = file.content_type or "application/octet-stream"

        # Persist to database
        media = Media(
            user_id=user_id,
            filename=unique_name,
            original_filename=file.filename,
            mime_type=mime_type,
            size=size,
            url=serving_url,
            storage_path=storage_path
        )
        db.add(media)
        db.commit()
        db.refresh(media)

        logger.info(f"Media uploaded: id={media.id} user={user_id} file={unique_name} size={size}")
        return media

    @staticmethod
    def get_user_media(db: Session, user_id: int) -> list[Media]:
        return (
            db.query(Media)
            .filter(Media.user_id == user_id)
            .order_by(Media.created_at.desc())
            .all()
        )

    @staticmethod
    def get_media(db: Session, media_id: int, user_id: int) -> Media:
        media = db.query(Media).filter(Media.id == media_id, Media.user_id == user_id).first()
        if not media:
            raise HTTPException(status_code=404, detail="Media not found")
        return media

    @staticmethod
    def update_alt_text(db: Session, media_id: int, user_id: int, alt_text: str) -> Media:
        media = MediaService.get_media(db, media_id, user_id)
        media.alt_text = alt_text
        db.commit()
        db.refresh(media)
        return media

    @staticmethod
    def delete_media(db: Session, media_id: int, user_id: int) -> bool:
        media = MediaService.get_media(db, media_id, user_id)

        # Remove file from disk
        if os.path.exists(media.storage_path):
            try:
                os.remove(media.storage_path)
            except OSError as e:
                logger.warning(f"Could not delete file {media.storage_path}: {e}")

        db.delete(media)
        db.commit()
        logger.info(f"Media deleted: id={media_id} user={user_id}")
        return True
