from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.schemas.notification import NotificationResponse
from app.services.notification_service import NotificationService

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)

@router.get("", response_model=list[NotificationResponse])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all notifications for the current user.
    """
    return NotificationService.get_notifications(db, current_user.id)

@router.put("/{notification_id}/read", response_model=NotificationResponse)
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark a notification as read.
    """
    return NotificationService.mark_as_read(db, current_user.id, notification_id)

@router.post("/read-all", response_model=list[NotificationResponse])
def read_all(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark all unread notifications as read.
    """
    return NotificationService.mark_all_as_read(db, current_user.id)

@router.post("/test", response_model=NotificationResponse)
def create_test_notification(
    title: str = "Test Notification",
    content: str = "This is a mock notification generated for testing.",
    type: str = "info",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate a test notification for verification.
    """
    return NotificationService.create_notification(db, current_user.id, title, content, type)
