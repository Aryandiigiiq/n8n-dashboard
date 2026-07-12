from app.integrations.registry.integration_registry import IntegrationRegistry

class IntegrationLoader:
    @staticmethod
    def load_connectors() -> None:
        # Trigger registration of default connectors
        from app.integrations.core.meta_connector import MetaConnector
        IntegrationRegistry.register(MetaConnector())
