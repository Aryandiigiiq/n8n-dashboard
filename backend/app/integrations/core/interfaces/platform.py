from abc import ABC, abstractmethod
from enum import Enum
from typing import Any
from app.models.account import Account

class Capability(str, Enum):
    PUBLISH_TEXT = "PUBLISH_TEXT"
    PUBLISH_IMAGE = "PUBLISH_IMAGE"
    PUBLISH_VIDEO = "PUBLISH_VIDEO"
    PUBLISH_CAROUSEL = "PUBLISH_CAROUSEL"
    READ_INBOX = "READ_INBOX"
    REPLY_COMMENTS = "REPLY_COMMENTS"

class BaseConnector(ABC):
    @property
    @abstractmethod
    def provider(self) -> str:
        pass

    @property
    @abstractmethod
    def capabilities(self) -> list[Capability]:
        pass

    @abstractmethod
    async def get_authorization_url(self, redirect_uri: str, state: str = None) -> str:
        pass

    @abstractmethod
    async def handle_callback(self, code: str, redirect_uri: str) -> dict[str, Any]:
        pass

    @abstractmethod
    async def refresh_credentials(self, credentials: dict[str, Any]) -> dict[str, Any]:
        pass

    @abstractmethod
    async def sync_accounts(self, credentials: dict[str, Any]) -> list[dict[str, Any]]:
        pass

    @abstractmethod
    async def publish_post(self, account: Account, content: str, media_urls: list[str]) -> dict[str, Any]:
        pass

    async def get_messages(self, account: Account) -> list[dict[str, Any]]:
        return []

    async def send_message(self, account: Account, conversation_id: str, content: str) -> dict[str, Any]:
        raise NotImplementedError("This connector does not support sending messages.")

    async def get_comments(self, account: Account) -> list[dict[str, Any]]:
        return []

    async def reply_comment(self, account: Account, comment_id: str, content: str) -> dict[str, Any]:
        raise NotImplementedError("This connector does not support replying to comments.")

    async def hide_comment(self, account: Account, comment_id: str, hide: bool) -> dict[str, Any]:
        raise NotImplementedError("This connector does not support hiding comments.")

    async def delete_comment(self, account: Account, comment_id: str) -> dict[str, Any]:
        raise NotImplementedError("This connector does not support deleting comments.")
