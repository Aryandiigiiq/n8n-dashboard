from sqlalchemy.orm import Session
from datetime import datetime, timezone
from fastapi import HTTPException
from app.models.notification import Notification

class NotificationService:
    @staticmethod
    def get_notifications(db: Session, user_id: int) -> list[Notification]:
        return db.query(Notification).filter(
            Notification.user_id == user_id
        ).order_by(Notification.created_at.desc()).all()

    @staticmethod
    def create_notification(db: Session, user_id: int, title: str, content: str, type: str) -> Notification:
        notif = Notification(
            user_id=user_id,
            title=title,
            content=content,
            type=type,
            is_read=False
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif

    @staticmethod
    def mark_as_read(db: Session, user_id: int, notification_id: int) -> Notification:
        notif = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        if not notif:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        notif.is_read = True
        notif.read_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(notif)
        return notif

    @staticmethod
    def mark_all_as_read(db: Session, user_id: int) -> list[Notification]:
        notifs = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).all()
        
        now = datetime.now(timezone.utc)
        for notif in notifs:
            notif.is_read = True
            notif.read_at = now
            
        db.commit()
        return db.query(Notification).filter(Notification.user_id == user_id).order_by(Notification.created_at.desc()).all()
