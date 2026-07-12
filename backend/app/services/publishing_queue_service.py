"""
PublishingQueueService – manages the publishing queue lifecycle.

Flow:
  POST /posts/{id}/ready  → mark post as ready, enqueue one job per account
  Background worker       → picks up queued jobs, calls publisher (mock or real)
  GET  /posts             → status reflects ready | publishing | published | failed
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.post import Post
from app.models.account import Account
from app.models.publishing_queue import PublishingQueue
from app.services.mock_publish_service import MockPublishService

logger = logging.getLogger(__name__)


class PublishingQueueService:

    # ──────────────────────────────────────────────────────────────────────────
    # Enqueue
    # ──────────────────────────────────────────────────────────────────────────

    @staticmethod
    def enqueue_post(db: Session, post_id: int, user_id: int) -> list[PublishingQueue]:
        """
        Mark a draft/ready post as 'ready' and create one queue entry per
        target account. Idempotent — re-queueing an already-queued post
        replaces only the 'queued' jobs (not in-progress or completed ones).
        """
        post = db.query(Post).filter(Post.id == post_id, Post.user_id == user_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")

        if post.status in ("published", "publishing"):
            raise HTTPException(
                status_code=400,
                detail=f"Cannot re-queue post with status '{post.status}'"
            )

        if not post.account_ids:
            raise HTTPException(status_code=400, detail="Post has no target accounts selected")

        if not post.content.strip() and not post.media_urls:
            raise HTTPException(status_code=400, detail="Post has no content or media")

        # Delete any previously queued (not yet started) jobs
        db.query(PublishingQueue).filter(
            PublishingQueue.post_id == post_id,
            PublishingQueue.status == "queued"
        ).delete()

        jobs: list[PublishingQueue] = []
        for account_id in post.account_ids:
            account = db.query(Account).filter(Account.id == account_id).first()
            if not account:
                logger.warning(f"Account {account_id} not found when enqueuing post {post_id}")
                continue

            job = PublishingQueue(
                post_id=post_id,
                account_id=account_id,
                status="queued",
                scheduled_at=post.scheduled_at
            )
            db.add(job)
            jobs.append(job)

        post.status = "ready"
        db.commit()

        for job in jobs:
            db.refresh(job)

        logger.info(f"Post {post_id} marked ready — {len(jobs)} queue job(s) created")
        return jobs

    # ──────────────────────────────────────────────────────────────────────────
    # Query
    # ──────────────────────────────────────────────────────────────────────────

    @staticmethod
    def get_queue(db: Session, user_id: int, status: Optional[str] = None) -> list[PublishingQueue]:
        """Return all queue entries for posts owned by user_id."""
        query = (
            db.query(PublishingQueue)
            .join(Post, PublishingQueue.post_id == Post.id)
            .filter(Post.user_id == user_id)
        )
        if status:
            query = query.filter(PublishingQueue.status == status)
        return query.order_by(PublishingQueue.created_at.desc()).all()

    # ──────────────────────────────────────────────────────────────────────────
    # Execute (called by background worker or manual trigger)
    # ──────────────────────────────────────────────────────────────────────────

    @staticmethod
    async def process_queued_jobs(db: Session) -> None:
        """
        Process all 'queued' publishing jobs using the MockPublishService.

        This is called by the background scheduler thread in publish_service.py.
        To wire in a real connector, replace MockPublishService.publish() with
        the appropriate IntegrationRegistry.get_connector(provider).publish_post().
        """
        jobs = (
            db.query(PublishingQueue)
            .filter(PublishingQueue.status == "queued")
            .all()
        )

        for job in jobs:
            post = db.query(Post).filter(Post.id == job.post_id).first()
            account = db.query(Account).filter(Account.id == job.account_id).first()

            if not post or not account:
                job.status = "failed"
                job.error_message = "Post or account not found"
                db.commit()
                continue

            job.status = "publishing"
            post.status = "publishing"
            db.commit()

            try:
                result = await MockPublishService.publish(post, account, db)

                if result.success:
                    job.status = "completed"
                    job.published_at = datetime.now(timezone.utc)
                    job.platform_response = result.raw_response
                else:
                    job.status = "failed"
                    job.error_message = result.error_message

            except Exception as exc:
                logger.error(f"Publishing job {job.id} failed: {exc}")
                job.status = "failed"
                job.error_message = str(exc)

            db.commit()

        # Update parent post statuses
        PublishingQueueService._reconcile_post_statuses(db)

    @staticmethod
    def _reconcile_post_statuses(db: Session) -> None:
        """Update Post.status based on the aggregate state of its queue jobs."""
        posts = db.query(Post).filter(Post.status.in_(["ready", "publishing"])).all()

        for post in posts:
            jobs = (
                db.query(PublishingQueue)
                .filter(PublishingQueue.post_id == post.id)
                .all()
            )
            if not jobs:
                continue

            statuses = {j.status for j in jobs}

            if statuses == {"completed"}:
                post.status = "published"
                post.published_at = datetime.now(timezone.utc)
            elif "failed" in statuses and "queued" not in statuses and "publishing" not in statuses:
                post.status = "failed"
                post.error_message = "; ".join(
                    j.error_message for j in jobs if j.error_message
                )
            elif "publishing" in statuses or "queued" in statuses:
                post.status = "publishing"

        db.commit()
