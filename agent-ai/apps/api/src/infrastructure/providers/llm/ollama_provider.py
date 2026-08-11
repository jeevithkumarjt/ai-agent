from __future__ import annotations

import json
from typing import AsyncIterator

import httpx

from domain.errors import DeadlineError, UpstreamError

from .base import Completion

_OLLAMA_CHAT = "/api/chat"


class OllamaProvider:
    name = "ollama"

    def __init__(self, base_url: str, *, timeout: float = 180.0):
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout

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
            "stream": False,
            "options": {"temperature": temperature, "num_predict": max_tokens},
        }
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                resp = await client.post(f"{self._base_url}{_OLLAMA_CHAT}", json=payload)
                resp.raise_for_status()
                data = resp.json()
        except httpx.HTTPStatusError as exc:
            raise UpstreamError(f"ollama returned {exc.response.status_code}", cause=exc) from exc
        except httpx.TimeoutException as exc:
            raise DeadlineError("ollama timed out") from exc
        except httpx.HTTPError as exc:
            raise UpstreamError("ollama connection error", cause=exc) from exc
        return Completion(text=data.get("message", {}).get("content", ""))

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
            "stream": True,
            "options": {"temperature": temperature, "num_predict": max_tokens},
        }
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                async with client.stream(
                    "POST", f"{self._base_url}{_OLLAMA_CHAT}", json=payload
                ) as resp:
                    resp.raise_for_status()
                    async for line in resp.aiter_lines():
                        if not line.strip():
                            continue
                        try:
                            chunk = json.loads(line)
                        except json.JSONDecodeError:
                            continue
                        content = chunk.get("message", {}).get("content")
                        if content:
                            yield content
                        if chunk.get("done"):
                            break
        except httpx.HTTPError as exc:
            raise UpstreamError("ollama stream error", cause=exc) from exc

    async def is_available(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(f"{self._base_url}/api/tags")
                return resp.status_code == 200
        except httpx.HTTPError:
            return False
