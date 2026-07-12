import asyncio
import threading
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.models.schedule import Schedule
from app.models.post import Post
from app.models.account import Account
from app.integrations.registry.integration_registry import IntegrationRegistry

logger = logging.getLogger(__name__)

class PublishService:
    @staticmethod
    async def process_pending_schedules() -> None:
        db = SessionLocal()
        try:
            now = datetime.now()
            schedules = db.query(Schedule).filter(
                Schedule.status == "pending",
                Schedule.scheduled_at <= now
            ).all()

            for sched in schedules:
                sched.status = "publishing"
                db.commit()

                post = db.query(Post).filter(Post.id == sched.post_id).first()
                account = db.query(Account).filter(Account.id == sched.account_id).first()

                if not post or not account:
                    sched.status = "failed"
                    sched.error_message = "Post or target account not found"
                    db.commit()
                    continue

                try:
                    connector = IntegrationRegistry.get_connector(account.integration.provider)
                    await connector.publish_post(
                        account=account,
                        content=post.content,
                        media_urls=post.media_urls
                    )

                    sched.status = "completed"
                    sched.published_at = datetime.now()
                    db.commit()
                except Exception as e:
                    sched.status = "failed"
                    sched.error_message = str(e)
                    db.commit()

            # Update parent posts status
            posts_to_check = db.query(Post).filter(Post.status == "scheduled").all()
            for post in posts_to_check:
                child_schedules = db.query(Schedule).filter(Schedule.post_id == post.id).all()
                if not child_schedules:
                    continue
                
                all_completed = all(s.status == "completed" for s in child_schedules)
                any_failed = any(s.status == "failed" for s in child_schedules)
                
                if all_completed:
                    post.status = "published"
                    post.published_at = datetime.now()
                elif any_failed:
                    post.status = "failed"
                    failed_msgs = [s.error_message for s in child_schedules if s.error_message]
                    post.error_message = "; ".join(failed_msgs)
                db.commit()

        except Exception as e:
            logger.error(f"Error checking pending schedules: {e}")
        finally:
            db.close()

    @staticmethod
    def start_scheduler_thread() -> None:
        def run_loop():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            async def periodic_check():
                while True:
                    await PublishService.process_pending_schedules()
                    await asyncio.sleep(10)  # check every 10 seconds
                    
            loop.run_until_complete(periodic_check())

        thread = threading.Thread(target=run_loop, daemon=True)
        thread.start()
        logger.info("Background publishing scheduler thread started successfully.")
