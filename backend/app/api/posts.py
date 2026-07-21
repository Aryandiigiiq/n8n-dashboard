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
    post_thumbnail: Optional[str] = None  # <-- FIXED: Tells FastAPI to let this string pass to the frontend

def get_or_create_workspace(db: Session, user_id: int) -> Workspace:
    ws = db.query(Workspace).filter(Workspace.owner_id == user_id).first()
    if not ws:
        ws = Workspace(name="Default Workspace", owner_id=user_id)
        db.add(ws)
        db.commit()
        db.refresh(ws)

    # Auto-seed default credentials using META_ACCESS_TOKEN if none exist
    cred = db.query(CredentialReference).filter(
        CredentialReference.workspace_id == ws.id
    ).first()
    if not cred:
        import os
        meta_token = os.getenv("META_ACCESS_TOKEN")
        if meta_token:
            cred = CredentialReference(
                workspace_id=ws.id,
                platform="instagram",
                account_id="instagram_me",
                account_name="Instagram (Auto)",
                page_id="instagram_page",
                page_access_token=meta_token,
                user_access_token=meta_token
            )
            db.add(cred)
            db.commit()
            db.refresh(ws)
    return ws

@router.post("/sync")
async def sync_posts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    workspace = get_or_create_workspace(db, current_user.id)
    credentials = db.query(CredentialReference).filter(
        CredentialReference.workspace_id == workspace.id
    ).all()

    if not credentials:
        return {"status": "skipped", "message": "No connected accounts to sync. Link accounts in Settings."}

    synced_total = 0
    platforms_synced = []

    async with httpx.AsyncClient() as client:
        for cred in credentials:
            if cred.platform == "instagram":
                is_basic_display = cred.page_access_token.startswith("IGAA")
                if is_basic_display:
                    media_res = await client.get(
                        "https://graph.instagram.com/me/media",
                        params={
                            "fields": "id,media_url,thumbnail_url,permalink,caption,timestamp,media_type",
                            "access_token": cred.page_access_token
                        }
                    )
                else:
                    media_res = await client.get(
                        f"https://graph.facebook.com/v22.0/{cred.account_id}/media",
                        params={
                            "fields": "id,media_url,thumbnail_url,permalink,caption,timestamp,like_count,comments_count,media_type",
                            "access_token": cred.page_access_token
                        }
                    )
                    
                if media_res.status_code == 200:
                    media_data = media_res.json().get("data", [])
                    for media in media_data:
                        post_id = media.get("id")
                        media_type = media.get("media_type")

                        post_thumbnail = (
                            media.get("thumbnail_url") if media_type == "VIDEO" 
                            else media.get("media_url")
                        )

                        likes = media.get("like_count")
                        if likes is None:
                            if media_type == "CAROUSEL_ALBUM":
                                insights_url = f"https://graph.facebook.com/v22.0/{post_id}/insights?metric=likes&access_token={cred.page_access_token}"
                                insights_res = await client.get(insights_url)
                                if insights_res.status_code == 200:
                                    insights_data = insights_res.json().get("data", [])
                                    if insights_data:
                                        likes = insights_data[0].get("values", [{}])[0].get("value", 0)

                        if likes is None:
                            likes = 0

                        comments = media.get("comments_count", 0)   
                        
                        auto = db.query(PostAutomation).filter(
                            PostAutomation.workspace_id == workspace.id,
                            PostAutomation.post_id == post_id
                        ).first()

                        if auto:
                            auto.like_count = likes
                            auto.comment_count = comments
                            auto.post_caption = media.get("caption", "")
                            auto.post_thumbnail = post_thumbnail
                            auto.media_type = media_type
                        else:
                            auto = PostAutomation(
                                workspace_id=workspace.id,
                                post_id=post_id,
                                permalink=media.get("permalink", ""),
                                platform="instagram",
                                post_thumbnail=post_thumbnail,
                                post_caption=media.get("caption", ""),
                                media_type=media_type,
                                like_count=likes,
                                comment_count=comments,
                                visual_graph={"nodes": [], "edges": []},
                                is_active=False
                            )
                            db.add(auto)
                    db.commit()
                    synced_total += len(media_data)
                    platforms_synced.append("instagram")
                else:
                    raise HTTPException(status_code=400, detail=f"Instagram API Error: {media_res.text}")

            elif cred.platform == "facebook":
                # Sync Facebook Page Feed
                feed_res = await client.get(
                    f"https://graph.facebook.com/v22.0/{cred.account_id}/feed",
                    params={
                        "fields": "id,message,permalink_url,created_time,likes.summary(true),comments.summary(true),attachments{media,type}",
                        "access_token": cred.page_access_token
                    }
                )
                
                if feed_res.status_code == 200:
                    feed_data = feed_res.json().get("data", [])
                    for post in feed_data:
                        post_id = post.get("id")
                        caption = post.get("message", "")
                        permalink = post.get("permalink_url", "")
                        
                        # Get likes and comments count from summary
                        likes = post.get("likes", {}).get("summary", {}).get("total_count", 0)
                        comments = post.get("comments", {}).get("summary", {}).get("total_count", 0)
                        
                        # Parse media attachment if present
                        attachments = post.get("attachments", {}).get("data", [])
                        post_thumbnail = None
                        media_type = "IMAGE"
                        
                        if attachments:
                            att = attachments[0]
                            post_thumbnail = att.get("media", {}).get("image", {}).get("src")
                            att_type = att.get("type", "")
                            if "video" in att_type.lower():
                                media_type = "VIDEO"
                            elif "album" in att_type.lower():
                                media_type = "CAROUSEL_ALBUM"

                        auto = db.query(PostAutomation).filter(
                            PostAutomation.workspace_id == workspace.id,
                            PostAutomation.post_id == post_id
                        ).first()

                        if auto:
                            auto.like_count = likes
                            auto.comment_count = comments
                            auto.post_caption = caption
                            auto.post_thumbnail = post_thumbnail
                            auto.media_type = media_type
                        else:
                            auto = PostAutomation(
                                workspace_id=workspace.id,
                                post_id=post_id,
                                permalink=permalink,
                                platform="facebook",
                                post_thumbnail=post_thumbnail,
                                post_caption=caption,
                                media_type=media_type,
                                like_count=likes,
                                comment_count=comments,
                                visual_graph={"nodes": [], "edges": []},
                                is_active=False
                            )
                            db.add(auto)
                    db.commit()
                    synced_total += len(feed_data)
                    platforms_synced.append("facebook")
                else:
                    raise HTTPException(status_code=400, detail=f"Facebook API Error: {feed_res.text}")

    return {
        "status": "success", 
        "synced_count": synced_total, 
        "platforms": platforms_synced
    }

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
            is_active=auto.is_active,
            post_thumbnail=auto.post_thumbnail  # <-- FIXED: Links your stored image column to the API return data
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

