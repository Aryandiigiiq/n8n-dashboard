from sqlalchemy.orm import Session
from app.models.schedule import Schedule
from app.models.post import Post
from app.models.account import Account
from fastapi import HTTPException
from datetime import datetime

class ScheduleService:
    @staticmethod
    def create_schedules_for_post(db: Session, post: Post) -> list[Schedule]:
        # Delete existing pending schedules for this post
        db.query(Schedule).filter(
            Schedule.post_id == post.id,
            Schedule.status == "pending"
        ).delete()
        
        if not post.scheduled_at:
            db.commit()
            return []

        schedules = []
        for account_id in post.account_ids:
            # Verify account exists
            acc = db.query(Account).filter(Account.id == account_id).first()
            if not acc:
                continue

            sched = Schedule(
                post_id=post.id,
                account_id=account_id,
                scheduled_at=post.scheduled_at,
                status="pending"
            )
            db.add(sched)
            schedules.append(sched)

        db.commit()
        return schedules

    @staticmethod
    def cancel_schedules_for_post(db: Session, post_id: int) -> None:
        db.query(Schedule).filter(
            Schedule.post_id == post_id,
            Schedule.status == "pending"
        ).delete()
        db.commit()

    @staticmethod
    def get_user_schedules(db: Session, user_id: int) -> list[Schedule]:
        return db.query(Schedule).join(Post).filter(Post.user_id == user_id).order_by(Schedule.scheduled_at.asc()).all()

    @staticmethod
    def reschedule_item(db: Session, schedule_id: int, user_id: int, new_date: datetime) -> Schedule:
        sched = db.query(Schedule).join(Post).filter(
            Schedule.id == schedule_id,
            Post.user_id == user_id
        ).first()

        if not sched:
            raise HTTPException(status_code=404, detail="Schedule task not found")

        if sched.status != "pending":
            raise HTTPException(status_code=400, detail="Cannot reschedule active/finished publishing task")

        sched.scheduled_at = new_date
        db.commit()
        db.refresh(sched)
        
        # Also update parent post scheduled_at if all schedules reschedule, 
        # or for simplicity, keep parent post updated
        post = db.query(Post).filter(Post.id == sched.post_id).first()
        if post:
            post.scheduled_at = new_date
            db.commit()

        return sched

    @staticmethod
    def cancel_schedule_item(db: Session, schedule_id: int, user_id: int) -> bool:
        sched = db.query(Schedule).join(Post).filter(
            Schedule.id == schedule_id,
            Post.user_id == user_id
        ).first()

        if not sched:
            raise HTTPException(status_code=404, detail="Schedule task not found")

        if sched.status != "pending":
            raise HTTPException(status_code=400, detail="Cannot cancel active/finished publishing task")

        db.delete(sched)
        db.commit()
        return True
