from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import AsyncIterator

from config import settings
from domain.errors import UpstreamError
from logging import get_logger

from .anthropic_provider import AnthropicProvider
from .base import LLMProvider
from .gemini_provider import GeminiProvider
from .ollama_provider import OllamaProvider
from .openai_provider import OpenAICompatibleProvider

logger = get_logger("llm.gateway")

RETRYABLE_STATUSES = {429, 500, 502, 503, 504}


@dataclass(frozen=True)
class RouteSpec:
    role: str
    provider: str
    model: str


class LLMGateway:
    """Routes completions to providers by role. Configuration-only switching; zero hardcoding."""

    def __init__(self) -> None:
        self._providers: dict[str, LLMProvider] = {}
        self._roles: dict[str, RouteSpec] = {}
        self._build_defaults()

    def _build_defaults(self) -> None:
        # Role → provider/model resolution. All read from settings; never hardcoded per-tenant.
        self._roles["default"] = RouteSpec("default", settings.llm_default_provider, settings.llm_default_model)
        self._roles["fast"] = RouteSpec("fast", settings.llm_default_provider, settings.llm_fast_model)
        self._roles["reasoning"] = RouteSpec("reasoning", settings.llm_default_provider, settings.llm_reasoning_model)

        self._providers["openai"] = OpenAICompatibleProvider(
            name="openai",
            api_key=settings.openai_api_key or "",
            base_url=settings.openai_base_url or "https://api.openai.com/v1",
            timeout=settings.llm_timeout_seconds,
        )
        self._providers["anthropic"] = AnthropicProvider(
            settings.anthropic_api_key or "", timeout=settings.llm_timeout_seconds
        )
        self._providers["gemini"] = GeminiProvider(
            settings.gemini_api_key or "", timeout=settings.llm_timeout_seconds
        )
        self._providers["mistral"] = OpenAICompatibleProvider(
            name="mistral",
            api_key=settings.mistral_api_key or "",
            base_url="https://api.mistral.ai/v1",
            timeout=settings.llm_timeout_seconds,
        )
        self._providers["groq"] = OpenAICompatibleProvider(
            name="groq",
            api_key=settings.groq_api_key or "",
            base_url="https://api.groq.com/openai/v1",
            timeout=settings.llm_timeout_seconds,
        )
        if settings.azure_openai_key and settings.azure_openai_endpoint:
            self._providers["azure"] = OpenAICompatibleProvider(
                name="azure",
                api_key=settings.azure_openai_key,
                base_url=settings.azure_openai_endpoint.rstrip("/"),
                extra_headers={"api-key": settings.azure_openai_key},
                extra_query={"api-version": "2024-06-01"},
                timeout=settings.llm_timeout_seconds,
            )
        self._providers["ollama"] = OllamaProvider(settings.ollama_base_url, timeout=settings.llm_timeout_seconds)

    def register_role(self, role: str, provider: str, model: str) -> None:
        self._roles[role] = RouteSpec(role, provider, model)

    def register_provider(self, name: str, provider: LLMProvider) -> None:
        self._providers[name] = provider

    def spec_for(self, role: str = "default", *, provider: str | None = None, model: str | None = None) -> RouteSpec:
        spec = self._roles.get(role, self._roles["default"])
        return RouteSpec(spec.role, provider or spec.provider, model or spec.model)

    def _resolve(self, spec: RouteSpec) -> LLMProvider:
        provider = self._providers.get(spec.provider)
        if provider is None:
            raise UpstreamError(f"provider {spec.provider} not configured")
        return provider

    async def complete(
        self,
        messages: list[dict],
        *,
        role: str = "default",
        provider: str | None = None,
        model: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
        max_retries: int = 2,
    ) -> Completion:
        spec = self.spec_for(role, provider=provider, model=model)
        provider_impl = self._resolve(spec)
        temperature = settings.llm_temperature if temperature is None else temperature
        max_tokens = settings.llm_max_tokens if max_tokens is None else max_tokens

        for attempt in range(max_retries + 1):
            try:
                return await provider_impl.complete(
                    messages, model=spec.model, temperature=temperature, max_tokens=max_tokens
                )
            except UpstreamError as exc:
                if attempt >= max_retries or not exc.retryable:
                    raise
                await asyncio.sleep(1.5 * (2**attempt))

        raise UpstreamError("llm complete failed after retries")

    async def stream(
        self,
        messages: list[dict],
        *,
        role: str = "default",
        provider: str | None = None,
        model: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> AsyncIterator[str]:
        spec = self.spec_for(role, provider=provider, model=model)
        provider_impl = self._resolve(spec)
        temperature = settings.llm_temperature if temperature is None else temperature
        max_tokens = settings.llm_max_tokens if max_tokens is None else max_tokens
        async for chunk in provider_impl.stream(
            messages, model=spec.model, temperature=temperature, max_tokens=max_tokens
        ):
            yield chunk


def default_gateway() -> LLMGateway:
    return LLMGateway()
