"""
MockPublishService – a mock publishing backend that exposes the same interface
the real platform publishers (MetaConnector, etc.) will implement.

Interface contract:
    publish(post, account, db) -> PublishResult

The real publisher will replace the mock body below; everything else (the
PublishingQueueService that calls it) stays unchanged.
"""

import logging
import uuid
from datetime import datetime, timezone
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)


@dataclass
class PublishResult:
    """Unified result returned by any publish implementation."""
    success: bool
    platform_post_id: Optional[str] = None
    permalink: Optional[str] = None
    error_message: Optional[str] = None
    raw_response: Optional[dict] = None


class MockPublishService:
    """
    Simulates publishing to any platform.

    Drop-in replacement for real connectors during development / CI.
    Maintains the same method signature so PublishingQueueService can
    swap between mock and real without modification.
    """

    @staticmethod
    async def publish(post, account, db=None) -> PublishResult:
        """
        Mock publishes a post to a given account.

        Args:
            post:    Post ORM model instance
            account: Account ORM model instance
            db:      Optional SQLAlchemy Session (unused in mock, present for interface parity)

        Returns:
            PublishResult indicating success with a fake post ID
        """
        platform = (account.metadata_json or {}).get("platform", "unknown")
        mock_id = f"mock_{platform}_{uuid.uuid4().hex[:8]}"

        logger.info(
            f"[MockPublishService] Publishing post id={post.id} "
            f"to account id={account.id} ({account.name}) on platform={platform}. "
            f"Assigned mock post id: {mock_id}"
        )

        # Simulate a brief I/O delay (real publisher would await an HTTP call)
        import asyncio
        await asyncio.sleep(0.5)

        return PublishResult(
            success=True,
            platform_post_id=mock_id,
            permalink=f"https://mock.social/{platform}/posts/{mock_id}",
            raw_response={
                "id": mock_id,
                "status": "published",
                "platform": platform,
                "account_id": account.id,
                "post_id": post.id,
                "published_at": datetime.now(timezone.utc).isoformat()
            }
        )
