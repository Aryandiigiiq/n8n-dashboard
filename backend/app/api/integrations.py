from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.schemas.integration import IntegrationResponse
from app.schemas.account import AccountResponse
from app.services.integration_service import IntegrationService
from app.integrations.registry.integration_registry import IntegrationRegistry
from app.auth.jwt import generate_oauth_state, verify_oauth_state

router = APIRouter(
    prefix="/integrations",
    tags=["Integrations"]
)

@router.get("", response_model=list[IntegrationResponse])
def get_integrations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return IntegrationService.get_user_integrations(db, current_user.id)

@router.get("/accounts", response_model=list[AccountResponse])
def get_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return IntegrationService.get_user_accounts(db, current_user.id)

@router.post("/connect", response_model=IntegrationResponse)
async def connect_integration(
    provider: str,
    code: str,
    redirect_uri: str,
    state: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_oauth_state(state, current_user.id, provider):
        raise HTTPException(status_code=400, detail="Invalid OAuth state parameter")
        
    return await IntegrationService.connect_integration(
        db, current_user.id, provider, code, redirect_uri
    )

@router.get("/auth-url")
async def get_auth_url(
    provider: str,
    redirect_uri: str,
    current_user: User = Depends(get_current_user)
):
    try:
        connector = IntegrationRegistry.get_connector(provider)
        state = generate_oauth_state(current_user.id, provider)
        url = await connector.get_authorization_url(redirect_uri, state)
        return {"url": url, "state": state}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{integration_id}")
def disconnect_integration(
    integration_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    IntegrationService.disconnect_integration(db, current_user.id, integration_id)
    return {"message": "Disconnected successfully"}
