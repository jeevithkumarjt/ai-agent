from __future__ import annotations

import json
from typing import AsyncIterator

import httpx

from domain.errors import DeadlineError, UpstreamError

from .base import Completion

_GEMINI_GENERATE = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
_GEMINI_STREAM = "https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent"


class GeminiProvider:
    name = "gemini"

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
        payload = {
            "contents": self._to_contents(messages),
            "generationConfig": {"temperature": temperature, "maxOutputTokens": max_tokens},
        }
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                resp = await client.post(
                    _GEMINI_GENERATE.format(model=model),
                    params={"key": self._api_key},
                    json=payload,
                )
                resp.raise_for_status()
                data = resp.json()
        except httpx.HTTPStatusError as exc:
            raise UpstreamError(f"gemini returned {exc.response.status_code}", cause=exc) from exc
        except httpx.TimeoutException as exc:
            raise DeadlineError("gemini timed out") from exc
        except httpx.HTTPError as exc:
            raise UpstreamError("gemini connection error", cause=exc) from exc

        text = ""
        for candidate in data.get("candidates", []):
            for part in candidate.get("content", {}).get("parts", []):
                text += part.get("text", "")
        usage = data.get("usageMetadata") or {}
        return Completion(
            text=text,
            prompt_tokens=usage.get("promptTokenCount", 0),
            completion_tokens=usage.get("candidatesTokenCount", 0),
            total_tokens=usage.get("totalTokenCount", 0),
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
            "contents": self._to_contents(messages),
            "generationConfig": {"temperature": temperature, "maxOutputTokens": max_tokens},
        }
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                async with client.stream(
                    "POST",
                    _GEMINI_STREAM.format(model=model),
                    params={"key": self._api_key, "alt": "sse"},
                    json=payload,
                ) as resp:
                    resp.raise_for_status()
                    async for line in resp.aiter_lines():
                        if not line.startswith("data:"):
                            continue
                        try:
                            chunk = json.loads(line[len("data:") :].strip())
                        except json.JSONDecodeError:
                            continue
                        for candidate in chunk.get("candidates", []):
                            for part in candidate.get("content", {}).get("parts", []):
                                if part.get("text"):
                                    yield part["text"]
        except httpx.HTTPError as exc:
            raise UpstreamError("gemini stream error", cause=exc) from exc

    @staticmethod
    def _to_contents(messages: list[dict]) -> list[dict]:
        contents = []
        for m in messages:
            if m["role"] == "system":
                continue
            role = "model" if m["role"] in {"assistant", "model"} else "user"
            contents.append({"role": role, "parts": [{"text": m["content"]}]})
        return contents

    async def is_available(self) -> bool:
        return bool(self._api_key)
