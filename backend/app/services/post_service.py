import logging
from sqlalchemy.orm import Session
from app.models.post import Post
from app.schemas.post import PostCreate, PostUpdate, PostPreviewData, CalendarEvent
from fastapi import HTTPException
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)


class PostService:

    # ──────────────────────────────────────────────────────────────────────────
    # Retrieval
    # ──────────────────────────────────────────────────────────────────────────

    @staticmethod
    def get_post(db: Session, post_id: int, user_id: int) -> Post:
        post = db.query(Post).filter(Post.id == post_id, Post.user_id == user_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        return post

    @staticmethod
    def get_user_posts(db: Session, user_id: int, status: Optional[str] = None) -> list[Post]:
        query = db.query(Post).filter(Post.user_id == user_id)
        if status:
            query = query.filter(Post.status == status)
        return query.order_by(Post.created_at.desc()).all()

    @staticmethod
    def get_drafts(db: Session, user_id: int) -> list[Post]:
        """Return only draft and ready posts (not scheduled/published)."""
        return (
            db.query(Post)
            .filter(Post.user_id == user_id, Post.status.in_(["draft", "ready"]))
            .order_by(Post.updated_at.desc())
            .all()
        )

    @staticmethod
    def get_calendar_events(db: Session, user_id: int) -> list[CalendarEvent]:
        """Return all scheduled posts formatted as calendar events."""
        posts = (
            db.query(Post)
            .filter(
                Post.user_id == user_id,
                Post.status.in_(["scheduled", "ready", "publishing", "published"]),
                Post.scheduled_at.isnot(None)
            )
            .order_by(Post.scheduled_at.asc())
            .all()
        )
        events: list[CalendarEvent] = []
        for p in posts:
            preview = p.content[:100] + "..." if len(p.content) > 100 else p.content
            events.append(
                CalendarEvent(
                    post_id=p.id,
                    title=p.title,
                    content_preview=preview,
                    platforms=p.platforms or [],
                    account_ids=p.account_ids or [],
                    scheduled_at=p.scheduled_at,
                    status=p.status
                )
            )
        return events

    @staticmethod
    def get_preview_data(db: Session, post_id: int, user_id: int) -> PostPreviewData:
        """Return preview-specific data for a post."""
        post = PostService.get_post(db, post_id, user_id)
        return PostPreviewData(
            id=post.id,
            title=post.title,
            content=post.content,
            media_urls=post.media_urls or [],
            platforms=post.platforms or [],
            account_ids=post.account_ids or [],
            status=post.status,
            scheduled_at=post.scheduled_at,
            created_at=post.created_at,
            updated_at=post.updated_at
        )

    # ──────────────────────────────────────────────────────────────────────────
    # Mutations
    # ──────────────────────────────────────────────────────────────────────────

    @staticmethod
    def create_post(db: Session, data: PostCreate, user_id: int) -> Post:
        # Determine initial status
        status = "draft"
        if data.scheduled_at:
            status = "scheduled"

        post = Post(
            user_id=user_id,
            title=data.title,
            content=data.content,
            media_urls=data.media_urls,
            platforms=data.platforms,
            account_ids=data.account_ids,
            status=status,
            scheduled_at=data.scheduled_at
        )
        db.add(post)
        db.commit()
        db.refresh(post)

        if post.status == "scheduled":
            from app.services.schedule_service import ScheduleService
            ScheduleService.create_schedules_for_post(db, post)

        logger.info(f"Post created: id={post.id} user={user_id} status={status}")
        return post

    @staticmethod
    def update_post(db: Session, post_id: int, data: PostUpdate, user_id: int) -> Post:
        post = PostService.get_post(db, post_id, user_id)

        # Prevent editing already published posts
        if post.status == "published":
            raise HTTPException(status_code=400, detail="Cannot edit a published post")

        update_dict = data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(post, key, value)

        # Recalculate status if scheduling changed
        if "scheduled_at" in update_dict:
            if post.scheduled_at and post.status in ("draft", "ready"):
                post.status = "scheduled"
            elif not post.scheduled_at and post.status == "scheduled":
                post.status = "draft"

        db.commit()
        db.refresh(post)

        from app.services.schedule_service import ScheduleService
        if post.status == "scheduled":
            ScheduleService.create_schedules_for_post(db, post)
        elif post.status in ("draft", "ready"):
            ScheduleService.cancel_schedules_for_post(db, post.id)

        logger.info(f"Post updated: id={post_id} status={post.status}")
        return post

    @staticmethod
    def delete_post(db: Session, post_id: int, user_id: int) -> bool:
        post = PostService.get_post(db, post_id, user_id)
        db.delete(post)
        db.commit()
        logger.info(f"Post deleted: id={post_id} user={user_id}")
        return True

    @staticmethod
    def mark_ready_to_publish(db: Session, post_id: int, user_id: int) -> Post:
        """
        Validates a post and marks it 'ready' for the publishing queue.
        The PublishingQueueService.enqueue_post() is called separately via the API.
        """
        post = PostService.get_post(db, post_id, user_id)

        if post.status == "published":
            raise HTTPException(status_code=400, detail="Post is already published")

        if post.status == "publishing":
            raise HTTPException(status_code=400, detail="Post is currently being published")

        if not post.content.strip() and not post.media_urls:
            raise HTTPException(
                status_code=400,
                detail="Cannot mark ready: post has no content or media"
            )

        if not post.account_ids:
            raise HTTPException(
                status_code=400,
                detail="Cannot mark ready: no target accounts selected"
            )

        post.status = "ready"
        db.commit()
        db.refresh(post)
        logger.info(f"Post {post_id} marked ready for publishing")
        return post
