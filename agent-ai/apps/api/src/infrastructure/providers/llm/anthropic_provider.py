from __future__ import annotations

import json
from typing import AsyncIterator

import httpx

from domain.errors import DeadlineError, UpstreamError

from .base import Completion

_ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
_ANTHROPIC_VERSION = "2023-06-01"


class AnthropicProvider:
    name = "anthropic"

    def __init__(self, api_key: str, *, timeout: float = 120.0):
        self._api_key = api_key
        self._timeout = timeout

    async def complete(
        self,
        messages: list[dict],
        *,
        model: str,
        temperature: float = 0.2,
        max_tokens: int = 1500,
    ) -> Completion:
        system, user_messages = self._split_system(messages)
        payload: dict = {
            "model": model,
            "messages": user_messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        if system:
            payload["system"] = system
        headers = {"x-api-key": self._api_key, "anthropic-version": _ANTHROPIC_VERSION}
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                resp = await client.post(_ANTHROPIC_URL, json=payload, headers=headers)
                resp.raise_for_status()
                data = resp.json()
        except httpx.HTTPStatusError as exc:
            raise UpstreamError(f"anthropic returned {exc.response.status_code}", cause=exc) from exc
        except httpx.TimeoutException as exc:
            raise DeadlineError("anthropic timed out") from exc
        except httpx.HTTPError as exc:
            raise UpstreamError("anthropic connection error", cause=exc) from exc

        text = "".join(block.get("text", "") for block in data.get("content", []) if block.get("type") == "text")
        usage = data.get("usage") or {}
        return Completion(
            text=text,
            prompt_tokens=usage.get("input_tokens", 0),
            completion_tokens=usage.get("output_tokens", 0),
            total_tokens=usage.get("input_tokens", 0) + usage.get("output_tokens", 0),
        )

    async def stream(
        self,
        messages: list[dict],
        *,
        model: str,
        temperature: float = 0.2,
        max_tokens: int = 1500,
    ) -> AsyncIterator[str]:
        system, user_messages = self._split_system(messages)
        payload: dict = {
            "model": model,
            "messages": user_messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "stream": True,
        }
        if system:
            payload["system"] = system
        headers = {"x-api-key": self._api_key, "anthropic-version": _ANTHROPIC_VERSION}
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                async with client.stream("POST", _ANTHROPIC_URL, json=payload, headers=headers) as resp:
                    resp.raise_for_status()
                    async for line in resp.aiter_lines():
                        if not line.startswith("data:"):
                            continue
                        try:
                            chunk = json.loads(line[len("data:") :].strip())
                        except json.JSONDecodeError:
                            continue
                        if chunk.get("type") == "content_block_delta":
                            delta = chunk.get("delta", {})
                            if delta.get("type") == "text_delta" and delta.get("text"):
                                yield delta["text"]
        except httpx.HTTPError as exc:
            raise UpstreamError("anthropic stream error", cause=exc) from exc

    @staticmethod
    def _split_system(messages: list[dict]) -> tuple[str | None, list[dict]]:
        system_parts = [m["content"] for m in messages if m["role"] == "system"]
        user_messages = [m for m in messages if m["role"] != "system"]
        return ("\n\n".join(system_parts) or None), user_messages

    async def is_available(self) -> bool:
        return bool(self._api_key)
