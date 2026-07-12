import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.database.session import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.schemas.post import PostCreate, PostUpdate, PostResponse, PostPreviewData, CalendarEvent
from app.schemas.publishing_queue import PublishingQueueResponse
from app.services.post_service import PostService
from app.services.publishing_queue_service import PublishingQueueService

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/posts",
    tags=["Posts"]
)


@router.get("", response_model=list[PostResponse])
def get_posts(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return PostService.get_user_posts(db, current_user.id, status)


@router.get("/drafts", response_model=list[PostResponse])
def get_drafts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Return only draft and ready-to-publish posts."""
    return PostService.get_drafts(db, current_user.id)


@router.get("/calendar", response_model=list[CalendarEvent])
def get_calendar_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Return all scheduled posts as calendar events."""
    return PostService.get_calendar_events(db, current_user.id)


@router.get("/{post_id}", response_model=PostResponse)
def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return PostService.get_post(db, post_id, current_user.id)


@router.get("/{post_id}/preview", response_model=PostPreviewData)
def get_post_preview(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Return preview-specific data for the post composer preview panel."""
    return PostService.get_preview_data(db, post_id, current_user.id)


@router.post("", response_model=PostResponse, status_code=201)
def create_post(
    data: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return PostService.create_post(db, data, current_user.id)


@router.put("/{post_id}", response_model=PostResponse)
def update_post(
    post_id: int,
    data: PostUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return PostService.update_post(db, post_id, data, current_user.id)


@router.delete("/{post_id}", status_code=204)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    PostService.delete_post(db, post_id, current_user.id)


@router.post("/{post_id}/ready", response_model=PostResponse)
def mark_ready(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark a post as 'ready to publish'.
    This validates the post and moves it to the publishing queue.
    """
    post = PostService.mark_ready_to_publish(db, post_id, current_user.id)
    PublishingQueueService.enqueue_post(db, post_id, current_user.id)
    return post


@router.get("/{post_id}/queue", response_model=list[PublishingQueueResponse])
def get_post_queue_status(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Return publishing queue entries for a specific post."""
    # Verify post ownership
    PostService.get_post(db, post_id, current_user.id)
    from app.models.publishing_queue import PublishingQueue
    return (
        db.query(PublishingQueue)
        .filter(PublishingQueue.post_id == post_id)
        .order_by(PublishingQueue.created_at.desc())
        .all()
    )
