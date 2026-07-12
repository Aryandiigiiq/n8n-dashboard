from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.schemas.message import MessageResponse, MessageSend
from app.services.message_service import MessageService

router = APIRouter(
    prefix="/messages",
    tags=["Messages"]
)

@router.post("/accounts/{account_id}/sync", response_model=list[MessageResponse])
async def sync_messages(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Sync and fetch latest messages for a connected social media account.
    """
    return await MessageService.sync_messages(db, current_user.id, account_id)

@router.get("/accounts/{account_id}/conversations")
async def get_conversations(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all conversation threads for a connected account.
    """
    return await MessageService.get_conversations(db, current_user.id, account_id)

@router.get("/accounts/{account_id}/conversations/{conversation_id}", response_model=list[MessageResponse])
async def get_conversation_messages(
    account_id: int,
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all messages inside a specific conversation thread.
    """
    # First sync or retrieve from db
    messages = await MessageService.get_messages(db, current_user.id, account_id)
    filtered = [m for m in messages if m.conversation_id == conversation_id]
    return filtered

@router.post("/accounts/{account_id}/conversations/{conversation_id}/reply", response_model=MessageResponse)
async def reply_to_conversation(
    account_id: int,
    conversation_id: str,
    payload: MessageSend,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send a message reply to a conversation thread.
    """
    return await MessageService.send_message(db, current_user.id, account_id, conversation_id, payload.content)
