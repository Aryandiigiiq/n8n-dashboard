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
from app.models.social_automation import SocialAutomation
from pydantic import BaseModel, Field

router = APIRouter(prefix="/posts", tags=["Posts"])

import datetime

class AutomationConfigSchema(BaseModel):
    platform_name: str
    automation_enabled: bool
    match_type: str
    ignore_case: bool
    keywords: List[str]
    reply_enabled: bool
    dm_enabled: bool
    reply_template: Optional[str] = ""
    dm_template: Optional[str] = ""
    reply_delay: int
    expires_at: Optional[datetime.datetime] = None
    campaign_name: Optional[str] = ""
    updated_by: Optional[str] = None


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

    is_basic_display = cred.page_access_token.startswith("IGAA")
    async with httpx.AsyncClient() as client:
        if is_basic_display:
            media_res = await client.get(
                "https://graph.instagram.com/me/media",
                params={
                    "fields": "id,media_url,permalink,caption,timestamp,media_type",
                    "access_token": cred.page_access_token
                }
            )
        else:
            media_res = await client.get(
                f"https://graph.facebook.com/v19.0/{cred.account_id}/media",
                params={
                    "fields": "id,media_url,permalink,caption,timestamp,like_count,comments_count,media_type",
                    "access_token": cred.page_access_token
                }
            )
            
        if media_res.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Failed to retrieve posts: {media_res.text}")
        
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
    platform: Optional[str] = None,
    campaign: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    workspace = get_or_create_workspace(db, current_user.id)
    query = db.query(PostAutomation).filter(PostAutomation.workspace_id == workspace.id)
    
    if platform:
        query = query.filter(PostAutomation.platform == platform)
    if campaign:
        query = query.filter(PostAutomation.campaign_name == campaign)
    if search:
        query = query.filter(PostAutomation.post_caption.ilike(f"%{search}%"))
        
    automations = query.all()

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
@router.get("/{post_id}/automation")
def get_post_automation(post_id: str, db: Session = Depends(get_db)):
    config = db.query(SocialAutomation).filter(SocialAutomation.post_id == post_id).first()
    if not config:
        # Return blank defaults if never configured
        return {
            "post_id": post_id,
            "platform_name": "instagram",
            "automation_enabled": False,
            "match_type": "contains",
            "ignore_case": True,
            "keywords": [],
            "reply_enabled": True,
            "dm_enabled": True,
            "reply_template": "",
            "dm_template": "",
            "reply_delay": 0,
            "expires_at": None,
            "campaign_name": "",
            "updated_by": None
        }
    return config

@router.post("/{post_id}/automation")
def save_post_automation(post_id: str, payload: AutomationConfigSchema, db: Session = Depends(get_db)):
    config = db.query(SocialAutomation).filter(SocialAutomation.post_id == post_id).first()
    if not config:
        config = SocialAutomation(post_id=post_id, **payload.dict())
        db.add(config)
    else:
        for key, val in payload.dict().items():
            setattr(config, key, val)
    db.commit()
    db.refresh(config)
    return config

