from typing import Callable

class AuthRegistry:
    _registry: dict[str, Callable[[str], str]] = {}

    @classmethod
    def register(cls, provider: str, url_generator: Callable[[str], str]) -> None:
        cls._registry[provider] = url_generator

    @classmethod
    def get_auth_url(cls, provider: str, redirect_uri: str) -> str:
        generator = cls._registry.get(provider)
        if not generator:
            raise ValueError(f"No auth url generator registered for provider: {provider}")
        return generator(redirect_uri)
