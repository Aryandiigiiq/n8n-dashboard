from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.workspace import Workspace
from app.models.credential import CredentialReference
from pydantic import BaseModel
import httpx
import os

router = APIRouter(prefix="/oauth/meta", tags=["OAuth"])

class CallbackPayload(BaseModel):
    code: str

def get_or_create_workspace(db: Session, user_id: int) -> Workspace:
    ws = db.query(Workspace).filter(Workspace.owner_id == user_id).first()
    if not ws:
        ws = Workspace(name="Default Workspace", owner_id=user_id)
        db.add(ws)
        db.commit()
        db.refresh(ws)
    return ws

@router.get("/instagram/authorize")
def authorize_instagram():
    client_id = os.getenv("META_APP_ID", "mock-id")
    redirect_uri = os.getenv("META_REDIRECT_URI", "http://localhost:3000/dashboard/accounts")
    scope = "instagram_basic,instagram_manage_comments,instagram_manage_messages,pages_show_list,pages_read_engagement"
    url = f"https://www.facebook.com/v19.0/dialog/oauth?client_id={client_id}&redirect_uri={redirect_uri}&scope={scope}&state=instagram"
    return {"url": url}

@router.get("/api/v1/auth/{platform}/connect")
def connect_platform(platform: str, current_user: User = Depends(get_current_user)):
    if platform not in ["meta", "linkedin", "tiktok"]:
        raise HTTPException(status_code=400, detail="Unsupported platform")
    # Dynamically generate and return OAuth redirect URL based on platform credentials



@router.post("/instagram/callback")
async def callback_instagram(
    payload: CallbackPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    client_id = os.getenv("META_APP_ID")
    client_secret = os.getenv("META_APP_SECRET")
    redirect_uri = os.getenv("META_REDIRECT_URI")

    async with httpx.AsyncClient() as client:
        token_res = await client.get(
            "https://graph.facebook.com/v19.0/oauth/access_token",
            params={
                "client_id": client_id,
                "client_secret": client_secret,
                "redirect_uri": redirect_uri,
                "code": payload.code
            }
        )
        if token_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch short-lived access token")
        user_token = token_res.json().get("access_token")

        long_res = await client.get(
            "https://graph.facebook.com/v19.0/oauth/access_token",
            params={
                "grant_type": "fb_exchange_token",
                "client_id": client_id,
                "client_secret": client_secret,
                "fb_exchange_token": user_token
            }
        )
        if long_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch long-lived access token")
        long_user_token = long_res.json().get("access_token")

        pages_res = await client.get(
            "https://graph.facebook.com/v19.0/me/accounts",
            params={"access_token": long_user_token}
        )
        pages_data = pages_res.json().get("data", [])
        if not pages_data:
            raise HTTPException(status_code=404, detail="No linked pages found")

        workspace = get_or_create_workspace(db, current_user.id)

        for page in pages_data:
            page_id = page.get("id")
            page_token = page.get("access_token")

            ig_res = await client.get(
                f"https://graph.facebook.com/v19.0/{page_id}",
                params={"fields": "instagram_business_account", "access_token": page_token}
            )
            ig_account = ig_res.json().get("instagram_business_account")
            if ig_account:
                cred = CredentialReference(
                    workspace_id=workspace.id,
                    platform="instagram",
                    account_id=ig_account.get("id"),
                    account_name=page.get("name"),
                    page_id=page_id,
                    page_access_token=page_token,
                    user_access_token=long_user_token
                )
                db.add(cred)
                db.commit()
                return {"status": "success", "connected_account": page.get("name")}

        raise HTTPException(status_code=404, detail="No Instagram Business account linked to Pages")

@router.get("/facebook/authorize")
def authorize_facebook():
    client_id = os.getenv("META_APP_ID", "mock-id")
    redirect_uri = os.getenv("META_REDIRECT_URI", "http://localhost:3000/dashboard/accounts")
    scope = "pages_show_list,pages_read_engagement,pages_manage_posts,publish_video"
    url = f"https://www.facebook.com/v19.0/dialog/oauth?client_id={client_id}&redirect_uri={redirect_uri}&scope={scope}&state=facebook"
    return {"url": url}

@router.post("/facebook/callback")
async def callback_facebook(
    payload: CallbackPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    client_id = os.getenv("META_APP_ID")
    client_secret = os.getenv("META_APP_SECRET")
    redirect_uri = os.getenv("META_REDIRECT_URI")

    async with httpx.AsyncClient() as client:
        token_res = await client.get(
            "https://graph.facebook.com/v19.0/oauth/access_token",
            params={
                "client_id": client_id,
                "client_secret": client_secret,
                "redirect_uri": redirect_uri,
                "code": payload.code
            }
        )
        if token_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch short-lived access token")
        user_token = token_res.json().get("access_token")

        pages_res = await client.get(
            "https://graph.facebook.com/v19.0/me/accounts",
            params={"access_token": user_token}
        )
        pages_data = pages_res.json().get("data", [])
        if not pages_data:
            raise HTTPException(status_code=404, detail="No linked pages found")

        workspace = get_or_create_workspace(db, current_user.id)
        page = pages_data[0]
        cred = CredentialReference(
            workspace_id=workspace.id,
            platform="facebook",
            account_id=page.get("id"),
            account_name=page.get("name"),
            page_id=page.get("id"),
            page_access_token=page.get("access_token"),
            user_access_token=user_token
        )
        db.add(cred)
        db.commit()
        return {"status": "success", "connected_account": page.get("name")}

@router.get("/linkedin/authorize")
def authorize_linkedin():
    client_id = os.getenv("LINKEDIN_CLIENT_ID", "mock-linkedin-id")
    redirect_uri = os.getenv("LINKEDIN_REDIRECT_URI", "http://localhost:3000/dashboard/accounts")
    scope = "w_member_social,r_liteprofile"
    url = f"https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id={client_id}&redirect_uri={redirect_uri}&state=linkedin&scope={scope}"
    return {"url": url}

@router.post("/linkedin/callback")
async def callback_linkedin(
    payload: CallbackPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    client_id = os.getenv("LINKEDIN_CLIENT_ID")
    client_secret = os.getenv("LINKEDIN_CLIENT_SECRET")
    redirect_uri = os.getenv("LINKEDIN_REDIRECT_URI")

    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://www.linkedin.com/oauth/v2/accessToken",
            data={
                "grant_type": "authorization_code",
                "code": payload.code,
                "redirect_uri": redirect_uri,
                "client_id": client_id,
                "client_secret": client_secret
            }
        )
        if token_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch LinkedIn token")
        access_token = token_res.json().get("access_token")

        profile_res = await client.get(
            "https://api.linkedin.com/v2/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        profile_data = profile_res.json()
        account_name = f"{profile_data.get('localizedFirstName', '')} {profile_data.get('localizedLastName', '')}".strip() or "LinkedIn Profile"

        workspace = get_or_create_workspace(db, current_user.id)
        cred = CredentialReference(
            workspace_id=workspace.id,
            platform="linkedin",
            account_id=profile_data.get("id"),
            account_name=account_name,
            page_access_token=access_token,
            user_access_token=access_token
        )
        db.add(cred)
        db.commit()
        return {"status": "success", "connected_account": account_name}
