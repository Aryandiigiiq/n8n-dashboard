from app.integrations.registry.capabilities import Capability

class CapabilityRegistry:
    _registry: dict[str, list[Capability]] = {}

    @classmethod
    def register(cls, provider: str, capabilities: list[Capability]) -> None:
        cls._registry[provider] = capabilities

    @classmethod
    def get_capabilities(cls, provider: str) -> list[Capability]:
        return cls._registry.get(provider, [])
