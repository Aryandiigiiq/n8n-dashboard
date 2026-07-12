import pytest
from app.integrations.core.interfaces.platform import BaseConnector, Capability
from app.integrations.registry.integration_registry import IntegrationRegistry
from app.models.account import Account

class MockConnector(BaseConnector):
    @property
    def provider(self) -> str:
        return "mock"

    @property
    def capabilities(self) -> list[Capability]:
        return [Capability.PUBLISH_TEXT]

    async def get_authorization_url(self, redirect_uri: str) -> str:
        return "https://mock.com/oauth"

    async def handle_callback(self, code: str, redirect_uri: str) -> dict:
        return {"access_token": "mock-token"}

    async def refresh_credentials(self, credentials: dict) -> dict:
        return credentials

    async def sync_accounts(self, credentials: dict) -> list[dict]:
        return [{"platform_id": "p123", "name": "Mock Account"}]

    async def publish_post(self, account: Account, content: str, media_urls: list[str]) -> dict:
        return {"id": "mock-post-123"}

def test_registry():
    connector = MockConnector()
    IntegrationRegistry.register(connector)
    assert IntegrationRegistry.get_connector("mock") == connector
    assert "mock" in IntegrationRegistry.list_providers()
