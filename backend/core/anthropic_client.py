"""Anthropic Messages API client (httpx, no SDK â€” ADR-002: owned and understood in full).

Supports non-streaming calls and SSE streaming. In streaming mode, tool_use input
is accumulated from input_json_delta fragments and emitted as ToolUse events at
block stop, and text deltas are emitted as TextDelta events as they arrive.
"""
from __future__ import annotations

import json
from collections.abc import AsyncIterator
from dataclasses import dataclass, field
from typing import Any

import httpx

from core.logging import get_logger
from core.settings import settings

logger = get_logger("core.anthropic")


class AnthropicError(Exception):
    def __init__(self, message: str, *, status_code: int | None = None, type: str | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.type = type


@dataclass
class ToolUse:
    id: str
    name: str
    input: dict[str, Any]


@dataclass
class AssistantTurn:
    text: str
    tool_uses: list[ToolUse] = field(default_factory=list)
    stop_reason: str | None = None
    usage: dict[str, int] = field(default_factory=dict)

    @property
    def wants_tools(self) -> bool:
        return bool(self.tool_uses)


@dataclass
class TextDelta:
    text: str


@dataclass
class MessageStop:
    turn: AssistantTurn


class AnthropicClient:
    def __init__(self, *, api_key: str | None = None, base_url: str | None = None, model: str | None = None) -> None:
        self.api_key = api_key or settings.anthropic_api_key
        self.base_url = base_url or settings.anthropic_base_url
        self.model = model or settings.anthropic_model
        if not self.api_key:
            raise AnthropicError("ANTHROPIC_API_KEY is not configured (ADR-007)")

    # -- shared request plumbing -------------------------------------------------

    def _headers(self) -> dict[str, str]:
        return {
            "x-api-key": self.api_key,
            "anthropic-version": settings.anthropic_version,
            "content-type": "application/json",
        }

    @staticmethod
    def _tool_schemas(tools: list[dict[str, Any]]) -> list[dict[str, Any]]:
        return [{"name": t["name"], "description": t["description"], "input_schema": t["input_schema"]} for t in tools]

    # -- non-streaming -----------------------------------------------------------

    async def complete(self, *, system: str, messages: list[dict], tools: list[dict[str, Any]] | None = None) -> AssistantTurn:
        payload: dict[str, Any] = {
            "model": self.model,
            "max_tokens": settings.anthropic_max_tokens,
            "system": system,
            "messages": messages,
        }
        if tools:
            payload["tools"] = self._tool_schemas(tools)
        async with httpx.AsyncClient(timeout=600) as client:
            resp = await client.post(f"{self.base_url}/v1/messages", headers=self._headers(), json=payload)
        if resp.status_code != 200:
            raise self._error_from_response(resp)
        data = resp.json()
        return self._parse_turn(data)

    # -- streaming ---------------------------------------------------------------

    async def stream(self, *, system: str, messages: list[dict], tools: list[dict[str, Any]] | None = None) -> AsyncIterator[TextDelta | MessageStop]:
        payload: dict[str, Any] = {
            "model": self.model,
            "max_tokens": settings.anthropic_max_tokens,
            "system": system,
            "messages": messages,
            "stream": True,
        }
        if tools:
            payload["tools"] = self._tool_schemas(tools)

        async with (
            httpx.AsyncClient(timeout=600) as client,
            client.stream("POST", f"{self.base_url}/v1/messages", headers=self._headers(), json=payload) as resp,
        ):
            if resp.status_code != 200:
                body = await resp.aread()
                raise self._error_from_body(resp.status_code, body)

            blocks: dict[int, dict[str, Any]] = {}
            text = ""
            tool_uses: list[ToolUse] = []
            usage: dict[str, int] = {}
            stop_reason: str | None = None

            async for line in resp.aiter_lines():
                if not line.startswith("data:"):
                    continue
                raw = line[len("data:") :].strip()
                if not raw or raw == "[DONE]":
                    continue
                event = json.loads(raw)
                etype = event.get("type")

                if etype == "content_block_start":
                    block = event.get("content_block", {})
                    blocks[event["index"]] = {
                        "type": block.get("type"),
                        "text": "",
                        "id": block.get("id"),
                        "name": block.get("name"),
                        "input_json": "",
                    }
                elif etype == "content_block_delta":
                    delta = event.get("delta", {})
                    if delta.get("type") == "text_delta":
                        piece = delta.get("text", "")
                        text += piece
                        blocks[event["index"]]["text"] += piece
                        yield TextDelta(piece)
                    elif delta.get("type") == "input_json_delta":
                        blocks[event["index"]]["input_json"] += delta.get("partial_json", "")
                elif etype == "content_block_stop":
                    block = blocks.get(event.get("index"))
                    if block and block.get("type") == "tool_use":
                        try:
                            tool_input = json.loads(block.get("input_json") or "{}")
                        except json.JSONDecodeError:
                            tool_input = {}
                        tool_uses.append(ToolUse(id=block["id"], name=block["name"], input=tool_input))
                elif etype == "message_delta":
                    stop_reason = event.get("delta", {}).get("stop_reason", stop_reason)
                elif etype == "message_start":
                    usage.update(event.get("message", {}).get("usage", {}))

            yield MessageStop(AssistantTurn(text=text, tool_uses=tool_uses, stop_reason=stop_reason, usage=usage))

    # -- parsing helpers ---------------------------------------------------------

    @staticmethod
    def _parse_turn(data: dict[str, Any]) -> AssistantTurn:
        text = ""
        tool_uses: list[ToolUse] = []
        for block in data.get("content", []):
            if block.get("type") == "text":
                text += block.get("text", "")
            elif block.get("type") == "tool_use":
                tool_uses.append(ToolUse(id=block["id"], name=block["name"], input=block.get("input") or {}))
        return AssistantTurn(
            text=text,
            tool_uses=tool_uses,
            stop_reason=data.get("stop_reason"),
            usage=data.get("usage", {}),
        )

    def _error_from_response(self, resp: httpx.Response) -> AnthropicError:
        return self._error_from_body(resp.status_code, resp.content)

    @staticmethod
    def _error_from_body(status_code: int, body: bytes) -> AnthropicError:
        try:
            data = json.loads(body)
            message = data.get("error", {}).get("message", "anthropic request failed")
            etype = data.get("error", {}).get("type")
        except json.JSONDecodeError:
            message = body[:500].decode("utf-8", "replace")
            etype = None
        return AnthropicError(message, status_code=status_code, type=etype)

