from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime, timezone
from app.models.account import Account
from app.models.comment import Comment
from app.models.post import Post
from app.integrations.registry.integration_registry import IntegrationRegistry

class CommentService:
    @staticmethod
    async def sync_comments(db: Session, user_id: int, account_id: int) -> list[Comment]:
        account = db.query(Account).filter(
            Account.id == account_id,
            Account.user_id == user_id
        ).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")

        connector = IntegrationRegistry.get_connector(account.integration.provider)
        comments_data = await connector.get_comments(account)

        synced_comments = []
        for comm_data in comments_data:
            # Check if post exists locally (to link post_id)
            post_id = None
            # Quick check if there is a local post linked with this platform ID
            # In post metadata or dynamic mapping (e.g. check by platform post id if we store it or by post content/similarity)
            # In our Post model, there's no platform_post_id field directly, but we can query by post metadata or structure
            # For simplicity, let's keep it Null or try to match if we can.
            
            existing_comm = db.query(Comment).filter(
                Comment.platform_comment_id == comm_data["platform_comment_id"]
            ).first()

            if existing_comm:
                existing_comm.content = comm_data["content"]
                existing_comm.is_hidden = comm_data["is_hidden"]
                existing_comm.is_deleted = comm_data["is_deleted"]
                existing_comm.is_from_me = comm_data["is_from_me"]
            else:
                existing_comm = Comment(
                    user_id=user_id,
                    account_id=account_id,
                    post_id=post_id,
                    platform_post_id=comm_data["platform_post_id"],
                    platform_comment_id=comm_data["platform_comment_id"],
                    parent_id=comm_data.get("parent_id"),
                    sender_id=comm_data["sender_id"],
                    sender_name=comm_data.get("sender_name"),
                    content=comm_data["content"],
                    is_hidden=comm_data.get("is_hidden", False),
                    is_deleted=comm_data.get("is_deleted", False),
                    is_from_me=comm_data.get("is_from_me", False),
                    sent_at=comm_data["sent_at"]
                )
                db.add(existing_comm)
            synced_comments.append(existing_comm)

        db.commit()
        return db.query(Comment).filter(
            Comment.account_id == account_id
        ).order_by(Comment.sent_at.desc()).all()

    @staticmethod
    async def get_comments(db: Session, user_id: int, account_id: int) -> list[Comment]:
        return db.query(Comment).filter(
            Comment.user_id == user_id,
            Comment.account_id == account_id,
            Comment.is_deleted == False
        ).order_by(Comment.sent_at.desc()).all()

    @staticmethod
    async def reply_to_comment(db: Session, user_id: int, account_id: int, comment_id: str, content: str) -> Comment:
        account = db.query(Account).filter(
            Account.id == account_id,
            Account.user_id == user_id
        ).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")

        # Get parent comment to obtain platform_post_id
        parent_comment = db.query(Comment).filter(
            Comment.platform_comment_id == comment_id
        ).first()
        platform_post_id = parent_comment.platform_post_id if parent_comment else "post_mock_1"
        post_id = parent_comment.post_id if parent_comment else None

        connector = IntegrationRegistry.get_connector(account.integration.provider)
        result = await connector.reply_comment(account, comment_id, content)

        # Save replies
        platform_comment_id = result.get("platform_comment_id")
        if not platform_comment_id:
            import uuid
            platform_comment_id = f"comm_mock_{uuid.uuid4().hex[:8]}"

        sent_at = result.get("sent_at") or datetime.now(timezone.utc)

        new_comm = Comment(
            user_id=user_id,
            account_id=account_id,
            post_id=post_id,
            platform_post_id=platform_post_id,
            platform_comment_id=platform_comment_id,
            parent_id=comment_id,
            sender_id=account.platform_id,
            sender_name=account.name,
            content=content,
            is_hidden=False,
            is_deleted=False,
            is_from_me=True,
            sent_at=sent_at
        )
        db.add(new_comm)
        db.commit()
        db.refresh(new_comm)
        return new_comm

    @staticmethod
    async def hide_comment(db: Session, user_id: int, account_id: int, comment_id: str, hide: bool) -> Comment:
        account = db.query(Account).filter(
            Account.id == account_id,
            Account.user_id == user_id
        ).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")

        comment = db.query(Comment).filter(
            Comment.platform_comment_id == comment_id,
            Comment.account_id == account_id
        ).first()
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")

        connector = IntegrationRegistry.get_connector(account.integration.provider)
        await connector.hide_comment(account, comment_id, hide)

        comment.is_hidden = hide
        db.commit()
        db.refresh(comment)
        return comment

    @staticmethod
    async def delete_comment(db: Session, user_id: int, account_id: int, comment_id: str) -> bool:
        account = db.query(Account).filter(
            Account.id == account_id,
            Account.user_id == user_id
        ).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")

        comment = db.query(Comment).filter(
            Comment.platform_comment_id == comment_id,
            Comment.account_id == account_id
        ).first()
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")

        connector = IntegrationRegistry.get_connector(account.integration.provider)
        await connector.delete_comment(account, comment_id)

        comment.is_deleted = True
        db.commit()
        return True
