from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.workspace import Workspace
from app.models.credential import CredentialReference
from app.models.automation import PostAutomation
from pydantic import BaseModel
from typing import Optional, List
import httpx

router = APIRouter(prefix="/posts", tags=["Posts"])

class SyncPostResponse(BaseModel):
    post_id: str
    permalink: str
    platform: str
    caption: Optional[str] = None
    media_type: Optional[str] = None
    likes: Optional[int] = 0
    comments: Optional[int] = 0
    automation_count: Optional[int] = 0
    is_active: Optional[bool] = False

def get_or_create_workspace(db: Session, user_id: int) -> Workspace:
    ws = db.query(Workspace).filter(Workspace.owner_id == user_id).first()
    if not ws:
        ws = Workspace(name="Default Workspace", owner_id=user_id)
        db.add(ws)
        db.commit()
        db.refresh(ws)
    return ws

@router.post("/sync")
async def sync_posts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    workspace = get_or_create_workspace(db, current_user.id)
    cred = db.query(CredentialReference).filter(
        CredentialReference.workspace_id == workspace.id,
        CredentialReference.platform == "instagram"
    ).first()

    if not cred:
        return {"status": "skipped", "message": "No connected accounts to sync. Link accounts in Settings."}

    async with httpx.AsyncClient() as client:
        media_res = await client.get(
            f"https://graph.facebook.com/v19.0/{cred.account_id}/media",
            params={
                "fields": "id,media_url,permalink,caption,timestamp,like_count,comments_count,media_type",
                "access_token": cred.page_access_token
            }
        )
        if media_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to retrieve posts from Instagram API")
        
        media_data = media_res.json().get("data", [])

        for media in media_data:
            post_id = media.get("id")
            auto = db.query(PostAutomation).filter(
                PostAutomation.workspace_id == workspace.id,
                PostAutomation.post_id == post_id
            ).first()

            if auto:
                auto.like_count = media.get("like_count", 0)
                auto.comment_count = media.get("comments_count", 0)
                auto.post_caption = media.get("caption", "")
                auto.post_thumbnail = media.get("media_url", "")
            else:
                auto = PostAutomation(
                    workspace_id=workspace.id,
                    post_id=post_id,
                    permalink=media.get("permalink", ""),
                    platform="instagram",
                    post_thumbnail=media.get("media_url", ""),
                    post_caption=media.get("caption", ""),
                    media_type=media.get("media_type"),
                    like_count=media.get("like_count", 0),
                    comment_count=media.get("comments_count", 0),
                    visual_graph={"nodes": [], "edges": []},
                    is_active=False
                )
                db.add(auto)
            db.commit()

    return {"status": "success", "synced_count": len(media_data)}

@router.get("", response_model=List[SyncPostResponse])
def list_posts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    workspace = get_or_create_workspace(db, current_user.id)
    automations = db.query(PostAutomation).filter(PostAutomation.workspace_id == workspace.id).all()

    response_list = []
    for auto in automations:
        flow_count = 1 if auto.n8n_workflow_id else 0
        response_list.append(
            SyncPostResponse(
                post_id=auto.post_id,
                permalink=auto.permalink,
                platform=auto.platform,
                caption=auto.post_caption,
                media_type=auto.media_type,
                likes=auto.like_count,
                comments=auto.comment_count,
                automation_count=flow_count,
                is_active=auto.is_active
            )
        )
    return response_list
