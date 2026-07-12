from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime, timezone
from app.models.account import Account
from app.models.message import Message
from app.integrations.registry.integration_registry import IntegrationRegistry

class MessageService:
    @staticmethod
    async def sync_messages(db: Session, user_id: int, account_id: int) -> list[Message]:
        # 1. Fetch account
        account = db.query(Account).filter(
            Account.id == account_id,
            Account.user_id == user_id
        ).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")

        # 2. Get connector
        connector = IntegrationRegistry.get_connector(account.integration.provider)
        
        # 3. Fetch from platform
        messages_data = await connector.get_messages(account)

        synced_messages = []
        for msg_data in messages_data:
            # Check if message already exists
            existing_msg = db.query(Message).filter(
                Message.platform_message_id == msg_data["platform_message_id"]
            ).first()

            if existing_msg:
                existing_msg.content = msg_data["content"]
                existing_msg.sent_at = msg_data["sent_at"]
                existing_msg.is_from_me = msg_data["is_from_me"]
            else:
                existing_msg = Message(
                    user_id=user_id,
                    account_id=account_id,
                    conversation_id=msg_data["conversation_id"],
                    platform_message_id=msg_data["platform_message_id"],
                    sender_id=msg_data["sender_id"],
                    sender_name=msg_data.get("sender_name"),
                    content=msg_data["content"],
                    is_from_me=msg_data["is_from_me"],
                    sent_at=msg_data["sent_at"]
                )
                db.add(existing_msg)
            
            synced_messages.append(existing_msg)

        db.commit()
        # Return all messages for this account sorted by sent_at
        return db.query(Message).filter(
            Message.account_id == account_id
        ).order_by(Message.sent_at.asc()).all()

    @staticmethod
    async def get_messages(db: Session, user_id: int, account_id: int) -> list[Message]:
        return db.query(Message).filter(
            Message.user_id == user_id,
            Message.account_id == account_id
        ).order_by(Message.sent_at.asc()).all()

    @staticmethod
    async def get_conversations(db: Session, user_id: int, account_id: int) -> list[dict]:
        # Return list of distinct conversations with their latest message
        # In SQL, we can query distinct conversation_id
        messages = db.query(Message).filter(
            Message.user_id == user_id,
            Message.account_id == account_id
        ).order_by(Message.sent_at.desc()).all()

        conversations = {}
        for msg in messages:
            if msg.conversation_id not in conversations:
                # Find other participant details (from messages where is_from_me is False)
                participant_name = "User"
                participant_id = "unknown"
                if not msg.is_from_me:
                    participant_name = msg.sender_name or "User"
                    participant_id = msg.sender_id
                else:
                    # Let's search if there's any message from them in the same conversation
                    other_msg = next((m for m in messages if m.conversation_id == msg.conversation_id and not m.is_from_me), None)
                    if other_msg:
                        participant_name = other_msg.sender_name or "User"
                        participant_id = other_msg.sender_id

                conversations[msg.conversation_id] = {
                    "conversation_id": msg.conversation_id,
                    "latest_message": msg.content,
                    "latest_message_time": msg.sent_at,
                    "participant_name": participant_name,
                    "participant_id": participant_id
                }

        return list(conversations.values())

    @staticmethod
    async def send_message(db: Session, user_id: int, account_id: int, conversation_id: str, content: str) -> Message:
        account = db.query(Account).filter(
            Account.id == account_id,
            Account.user_id == user_id
        ).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")

        connector = IntegrationRegistry.get_connector(account.integration.provider)
        
        # Send via platform API
        result = await connector.send_message(account, conversation_id, content)

        # Save to DB
        platform_message_id = result.get("platform_message_id")
        if not platform_message_id:
            import uuid
            platform_message_id = f"sent_{uuid.uuid4().hex[:8]}"

        sent_at = result.get("sent_at")
        if not sent_at:
            sent_at = datetime.now(timezone.utc)

        new_msg = Message(
            user_id=user_id,
            account_id=account_id,
            conversation_id=conversation_id,
            platform_message_id=platform_message_id,
            sender_id=account.platform_id,
            sender_name=account.name,
            content=content,
            is_from_me=True,
            sent_at=sent_at
        )
        db.add(new_msg)
        db.commit()
        db.refresh(new_msg)

        return new_msg
