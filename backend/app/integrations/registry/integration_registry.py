from app.integrations.core.interfaces.platform import BaseConnector

class IntegrationRegistry:
    _connectors: dict[str, BaseConnector] = {}

    @classmethod
    def register(cls, connector: BaseConnector) -> None:
        cls._connectors[connector.provider] = connector

    @classmethod
    def get_connector(cls, provider: str) -> BaseConnector:
        connector = cls._connectors.get(provider)
        if not connector:
            raise ValueError(f"No connector registered for provider: {provider}")
        return connector

    @classmethod
    def list_providers(cls) -> list[str]:
        return list(cls._connectors.keys())
