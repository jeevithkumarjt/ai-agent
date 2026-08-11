from __future__ import annotations

import json
from typing import AsyncIterator

import httpx

from domain.errors import DeadlineError, UpstreamError

from .base import Completion

_OPENAI_BASE = "https://api.openai.com/v1"


class OpenAICompatibleProvider:
    """OpenAI, Azure OpenAI, and Groq all speak the chat/completions wire protocol."""

    name: str

    def __init__(
        self,
        *,
        name: str,
        api_key: str,
        base_url: str = _OPENAI_BASE,
        extra_headers: dict | None = None,
        extra_query: dict | None = None,
        timeout: float = 120.0,
    ):
        self.name = name
        self._api_key = api_key
        self._base_url = base_url.rstrip("/")
        self._extra_headers = extra_headers or {}
        self._extra_query = extra_query or {}
        self._timeout = timeout

    def _client(self) -> httpx.AsyncClient:
        return httpx.AsyncClient(
            base_url=self._base_url,
            headers={"Authorization": f"Bearer {self._api_key}", **self._extra_headers},
            timeout=self._timeout,
        )

    async def complete(
        self,
        messages: list[dict],
        *,
        model: str,
        temperature: float = 0.2,
        max_tokens: int = 1500,
    ) -> Completion:
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False,
        }
        try:
            async with self._client() as client:
                resp = await client.post("/chat/completions", json=payload, params=self._extra_query)
                resp.raise_for_status()
                data = resp.json()
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code >= 500 or exc.response.status_code == 429:
                raise UpstreamError(
                    f"{self.name} returned {exc.response.status_code}",
                    detail={"status": exc.response.status_code},
                    cause=exc,
                ) from exc
            raise UpstreamError(f"{self.name} returned {exc.response.status_code}", cause=exc) from exc
        except httpx.TimeoutException as exc:
            raise DeadlineError(f"{self.name} timed out") from exc
        except httpx.HTTPError as exc:
            raise UpstreamError(f"{self.name} connection error", cause=exc) from exc

        choice = data["choices"][0]
        content = choice.get("message", {}).get("content") or ""
        usage = data.get("usage") or {}
        return Completion(
            text=content,
            prompt_tokens=usage.get("prompt_tokens", 0),
            completion_tokens=usage.get("completion_tokens", 0),
            total_tokens=usage.get("total_tokens", 0),
            finish_reason=choice.get("finish_reason"),
        )

    async def stream(
        self,
        messages: list[dict],
        *,
        model: str,
        temperature: float = 0.2,
        max_tokens: int = 1500,
    ) -> AsyncIterator[str]:
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
        }
        try:
            async with self._client() as client:
                async with client.stream(
                    "POST", "/chat/completions", json=payload, params=self._extra_query
                ) as resp:
                    resp.raise_for_status()
                    async for line in resp.aiter_lines():
                        if not line.startswith("data:"):
                            continue
                        chunk = line[len("data:") :].strip()
                        if chunk == "[DONE]":
                            break
                        try:
                            delta = json.loads(chunk)
                            content = delta["choices"][0].get("delta", {}).get("content")
                            if content:
                                yield content
                        except (json.JSONDecodeError, KeyError, IndexError):
                            continue
        except httpx.HTTPError as exc:
            raise UpstreamError(f"{self.name} stream error", cause=exc) from exc

    async def is_available(self) -> bool:
        return bool(self._api_key)
