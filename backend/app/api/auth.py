
# Add:

# POST /login

# This endpoint should:

# Validate email/password
# Call AuthService.login()
# Return:
# {
#   "access_token": "...",
#   "token_type": "bearer"
# }

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.auth import TokenResponse
from app.services.auth_service import AuthService
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import UserMeResponse

router = APIRouter(tags=["Auth"])

@router.post("/auth/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Login with email and password
    """
    return AuthService.login(db, form_data.username, form_data.password)

@router.get("/me", response_model=UserMeResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Get current user details
    """
    return current_user