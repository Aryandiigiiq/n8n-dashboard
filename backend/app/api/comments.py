from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.schemas.comment import CommentResponse, CommentReply
from app.services.comment_service import CommentService

router = APIRouter(
    prefix="/comments",
    tags=["Comments"]
)

@router.post("/accounts/{account_id}/sync", response_model=list[CommentResponse])
async def sync_comments(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Sync and fetch latest comments for a connected social media account.
    """
    return await CommentService.sync_comments(db, current_user.id, account_id)

@router.get("/accounts/{account_id}", response_model=list[CommentResponse])
async def get_comments(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all comments for an account.
    """
    return await CommentService.get_comments(db, current_user.id, account_id)

@router.post("/accounts/{account_id}/{comment_id}/reply", response_model=CommentResponse)
async def reply_to_comment(
    account_id: int,
    comment_id: str,
    payload: CommentReply,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Post a reply to a comment.
    """
    return await CommentService.reply_to_comment(db, current_user.id, account_id, comment_id, payload.content)

@router.post("/accounts/{account_id}/{comment_id}/hide", response_model=CommentResponse)
async def hide_comment(
    account_id: int,
    comment_id: str,
    hide: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Hide or unhide a comment.
    """
    return await CommentService.hide_comment(db, current_user.id, account_id, comment_id, hide)

@router.delete("/accounts/{account_id}/{comment_id}")
async def delete_comment(
    account_id: int,
    comment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a comment.
    """
    await CommentService.delete_comment(db, current_user.id, account_id, comment_id)
    return {"message": "Comment deleted successfully"}
