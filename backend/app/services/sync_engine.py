import asyncio
from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.models.credential import CredentialReference
from app.models.automation import PostAutomation
from app.workflow.client import N8NClient
import httpx

async def sync_platform_metrics():
    db = SessionLocal()
    try:
        credentials = db.query(CredentialReference).all()
        async with httpx.AsyncClient() as client:
            for cred in credentials:
                if cred.platform == "instagram":
                    res = await client.get(
                        f"https://graph.facebook.com/v19.0/{cred.account_id}/media",
                        params={
                            "fields": "id,like_count,comments_count",
                            "access_token": cred.page_access_token
                        }
                    )
                    if res.status_code == 200:
                        media_data = res.json().get("data", [])
                        for media in media_data:
                            post = db.query(PostAutomation).filter(
                                PostAutomation.post_id == media.get("id"),
                                PostAutomation.workspace_id == cred.workspace_id
                            ).first()
                            if post:
                                post.like_count = media.get("like_count", 0)
                                post.comment_count = media.get("comments_count", 0)
                        db.commit()
    except Exception as e:
        print(f"Error syncing background metrics: {e}")
    finally:
        db.close()

async def sync_scheduler_loop():
    while True:
        await sync_platform_metrics()
        await asyncio.sleep(900)  # Sync every 15 minutes
