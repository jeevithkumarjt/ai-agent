"""OpenAI-format Chat Completions client (httpx, no SDK).

Mirrors the AnthropicClient.stream() interface (yields TextDelta / MessageStop)
so the Orchestrator is provider-agnostic. Converts Anthropic wire-format messages
(from _reconstruct_anthropic_messages) into OpenAI chat-completions format.
Used for providers that expose only OpenAI-compatible endpoints (e.g. Groq).

Includes retry logic with exponential backoff for rate-limited (429) and
transient server errors (5xx).
"""
from __future__ import annotations

import asyncio
import json
from collections.abc import AsyncIterator
from typing import Any

import httpx

from core.anthropic_client import AnthropicError, AssistantTurn, MessageStop, TextDelta, ToolUse
from core.logging import get_logger
from core.settings import settings

logger = get_logger("core.openai")

_MAX_RETRIES = 2
_RETRY_BASE_DELAY = 5.0


class _ThinkingFilter:
    """Streaming-aware filter that strips <think>...</think> blocks from model output.

    If the model puts the entire response inside <think>, we extract the last
    meaningful paragraph as the visible answer (qwen reasoning mode)."""

    def __init__(self) -> None:
        self._in_thinking = False
        self._buffer = ""
        self._visible = ""
        self._thinking_buf = ""
        self._thinking_only = True

    def feed(self, chunk: str) -> str:
        self._buffer += chunk
        result = ""
        while self._buffer:
            if self._in_thinking:
                end = self._buffer.find("</think>")
                if end == -1:
                    self._buffer = self._buffer[-20:] if len(self._buffer) > 20 else self._buffer
                    break
                self._thinking_buf += self._buffer[:end]
                self._buffer = self._buffer[end + 8:]
                self._in_thinking = False
            else:
                start = self._buffer.find("<think>")
                if start == -1:
                    piece = self._buffer
                    self._buffer = ""
                else:
                    piece = self._buffer[:start]
                    self._buffer = self._buffer[start + len("<think>"):]
                    self._in_thinking = True
                    self._thinking_buf = ""
                if piece:
                    self._visible += piece
                    self._thinking_only = False
                    result += piece
        return result

    def flush(self) -> str:
        """Call after stream ends to extract answer from thinking-only responses."""
        remaining = self._buffer
        self._buffer = ""
        if remaining:
            self._visible += remaining
            self._thinking_only = False

        if self._visible.strip():
            return ""

        # Model put entire response in <think>. Return the thinking content as-is.
        if self._thinking_buf.strip():
            return self._thinking_buf.strip() + "\n"
        return ""


class OpenAICompatClient:
    def __init__(self, *, api_key: str | None = None, base_url: str | None = None, model: str | None = None) -> None:
        self.api_key = api_key or settings.anthropic_api_key
        self.base_url = base_url or settings.anthropic_base_url
        self.model = model or settings.anthropic_model
        self.timeout = 180
        if not self.api_key:
            raise AnthropicError("ANTHROPIC_API_KEY is not configured (ADR-007)")

    # -- request plumbing -------------------------------------------------------

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "content-type": "application/json",
        }

    @staticmethod
    def _openai_tools(tools: list[dict[str, Any]]) -> list[dict[str, Any]]:
        return [
            {
                "type": "function",
                "function": {
                    "name": t["name"],
                    "description": t.get("description", ""),
                    "parameters": t.get("input_schema", {"type": "object", "properties": {}}),
                },
            }
            for t in tools
        ]

    @staticmethod
    def _content_text(content: Any) -> str:
        if isinstance(content, str):
            return content
        if isinstance(content, list):
            return "".join(OpenAICompatClient._content_text(c) for c in content)
        if isinstance(content, dict):
            if "content" in content:
                return OpenAICompatClient._content_text(content["content"])
            return json.dumps(content)
        return str(content)

    @classmethod
    def _to_openai_messages(cls, messages: list[dict[str, Any]]) -> list[dict[str, Any]]:
        out: list[dict[str, Any]] = []
        for msg in messages:
            role = msg.get("role")
            content = msg.get("content")
            if role == "user":
                if isinstance(content, str):
                    out.append({"role": "user", "content": content})
                elif isinstance(content, list):
                    text_parts: list[str] = []
                    for block in content:
                        if not isinstance(block, dict):
                            text_parts.append(str(block))
                        elif block.get("type") == "tool_result":
                            out.append(
                                {
                                    "role": "tool",
                                    "tool_call_id": block.get("tool_use_id", ""),
                                    "content": cls._content_text(block.get("content")),
                                }
                            )
                        elif block.get("type") == "text":
                            text_parts.append(block.get("text", ""))
                        else:
                            text_parts.append(cls._content_text(block))
                    if text_parts:
                        out.append({"role": "user", "content": "".join(text_parts)})
            elif role == "tool":
                out.append({"role": "tool", "tool_call_id": msg.get("tool_use_id", ""), "content": cls._content_text(content)})
            elif role == "assistant":
                if isinstance(content, str):
                    out.append({"role": "assistant", "content": content})
                elif isinstance(content, list):
                    text = "".join(b.get("text", "") for b in content if isinstance(b, dict) and b.get("type") == "text")
                    tool_calls = []
                    for b in content:
                        if isinstance(b, dict) and b.get("type") == "tool_use":
                            tool_calls.append(
                                {
                                    "id": b.get("id", ""),
                                    "type": "function",
                                    "function": {"name": b.get("name", ""), "arguments": json.dumps(b.get("input") or {})},
                                }
                            )
                    message: dict[str, Any] = {"role": "assistant", "content": text}
                    if tool_calls:
                        message["tool_calls"] = tool_calls
                    out.append(message)
        return out

    # -- streaming with retry ---------------------------------------------------

    async def _stream_once(
        self, *, url: str, payload: dict[str, Any]
    ) -> tuple[list[str], list[str], dict[int, dict[str, str]], str | None, dict[str, int]]:
        """Single streaming attempt. Returns (content_parts, reasoning_parts, tool_acc, stop_reason, usage)."""
        content: list[str] = []
        reasoning: list[str] = []
        seen_keys: set[str] = set()
        tool_acc: dict[int, dict[str, str]] = {}
        stop_reason: str | None = None
        usage: dict[str, int] = {}

        async with (
            httpx.AsyncClient(timeout=self.timeout) as client,
            client.stream("POST", url, headers=self._headers(), json=payload) as resp,
        ):
            if resp.status_code == 429:
                retry_after = float(resp.headers.get("retry-after", "5"))
                raise AnthropicError(
                    f"rate limited (429), retry after {retry_after}s", status_code=429
                )
            if resp.status_code >= 500:
                raise AnthropicError(
                    f"server error: {resp.status_code}", status_code=resp.status_code
                )
            if resp.status_code != 200:
                body = b""
                async for chunk in resp.aiter_bytes():
                    body += chunk
                    if len(body) > 500:
                        break
                raise AnthropicError(
                    f"request failed: {resp.status_code} {body.decode(errors='replace')[:300]}",
                    status_code=resp.status_code,
                )
            async for line in resp.aiter_lines():
                if not line.startswith("data:"):
                    continue
                data = line[5:].strip()
                if not data or data == "[DONE]":
                    continue
                try:
                    chunk = json.loads(data)
                except json.JSONDecodeError:
                    continue
                if chunk.get("usage"):
                    usage.update(chunk["usage"])
                for choice in chunk.get("choices") or []:
                    delta = choice.get("delta") or {}
                    seen_keys.update(delta.keys())
                    piece = delta.get("content")
                    if piece:
                        content.append(piece)
                    # Reasoning-style models (e.g. groq/compound-mini) stream the
                    # answer in `delta.reasoning` and leave `content` empty, so the
                    # final response is a fallback of reasoning when content is absent.
                    reason_piece = delta.get("reasoning")
                    if reason_piece:
                        reasoning.append(reason_piece)
                    for tc in delta.get("tool_calls") or []:
                        idx = tc.get("index", 0)
                        acc = tool_acc.setdefault(idx, {"id": "", "name": "", "args": ""})
                        if tc.get("id"):
                            acc["id"] = tc["id"]
                        fn = tc.get("function") or {}
                        if fn.get("name"):
                            acc["name"] += fn["name"]
                        if fn.get("arguments"):
                            acc["args"] += fn["arguments"]
                    if choice.get("finish_reason"):
                        stop_reason = choice["finish_reason"]

        return content, reasoning, seen_keys, tool_acc, stop_reason, usage

    async def _complete_once(
        self, *, url: str, payload: dict[str, Any]
    ) -> tuple[str, str | None, dict[str, int]]:
        """Single NON-streaming completion attempt. Returns (text, finish_reason, usage).

        Groq's free tier intermittently returns empty streams (200 with no content
        and no reasoning deltas). A non-streaming request for the same payload
        consistently returns the full answer, so it is used as a reliable fallback.
        """
        plain = dict(payload)
        plain["stream"] = False
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(url, headers=self._headers(), json=plain)
            if resp.status_code == 429:
                retry_after = float(resp.headers.get("retry-after", "5"))
                raise AnthropicError(
                    f"rate limited (429), retry after {retry_after}s", status_code=429
                )
            if resp.status_code >= 500:
                raise AnthropicError(
                    f"server error: {resp.status_code}", status_code=resp.status_code
                )
            if resp.status_code != 200:
                raise AnthropicError(
                    f"request failed: {resp.status_code} {resp.text[:300]}",
                    status_code=resp.status_code,
                )
            data = resp.json()
            choice = (data.get("choices") or [{}])[0]
            message = choice.get("message") or {}
            text = message.get("content") or message.get("reasoning") or ""
            return text, choice.get("finish_reason"), data.get("usage") or {}

    async def stream(
        self, *, system: str, messages: list[dict[str, Any]], tools: list[dict[str, Any]] | None = None
    ) -> AsyncIterator[TextDelta | MessageStop]:
        url = f"{self.base_url.rstrip('/')}/chat/completions"
        payload: dict[str, Any] = {
            "model": self.model,
            "max_tokens": settings.anthropic_max_tokens,
            "stream": True,
            "messages": [{"role": "system", "content": system}, *self._to_openai_messages(messages)],
        }
        if tools:
            payload["tools"] = self._openai_tools(tools)

        last_error: Exception | None = None
        for attempt in range(_MAX_RETRIES):
            try:
                content, reasoning, seen_keys, tool_acc, stop_reason, usage = await self._stream_once(url=url, payload=payload)

                tool_uses = []
                for acc in tool_acc.values():
                    try:
                        tool_input = json.loads(acc["args"] or "{}")
                    except json.JSONDecodeError:
                        tool_input = {}
                    tool_uses.append(ToolUse(id=acc["id"], name=acc["name"], input=tool_input))

                # Prefer visible content; fall back to the reasoning stream for
                # models that only emit the answer there.
                combined = "".join(content) or "".join(reasoning)
                turn = AssistantTurn(text=combined, tool_uses=tool_uses, stop_reason=stop_reason, usage=usage)

                if not combined.strip() and not tool_uses:
                    logger.warning("llm_empty_response", attempt=attempt, model=self.model)
                    if attempt < _MAX_RETRIES - 1:
                        delay = _RETRY_BASE_DELAY * (2 ** attempt)
                        await asyncio.sleep(delay)
                        continue
                    # All streaming attempts came back empty. Retry through the
                    # non-streaming path, which has proven reliable for this model.
                    try:
                        logger.warning("llm_stream_empty_using_nonstream", model=self.model)
                        text2, finish2, usage2 = await self._complete_once(url=url, payload=payload)
                    except Exception:  # noqa: BLE001
                        text2, finish2 = "", None
                    if text2.strip():
                        tf2 = _ThinkingFilter()
                        clean2 = tf2.feed(text2)
                        rem2 = tf2.flush()
                        if rem2:
                            clean2 += rem2
                        if clean2:
                            yield TextDelta(clean2)
                        turn = AssistantTurn(text=text2, tool_uses=[], stop_reason=finish2, usage=usage2)
                        yield MessageStop(turn)
                        return
                    logger.warning("llm_nonstream_also_empty", model=self.model)
                    yield MessageStop(AssistantTurn(text="", tool_uses=[], stop_reason=None, usage={}))
                    return

                tf = _ThinkingFilter()
                clean = tf.feed(combined)
                remaining = tf.flush()
                if remaining:
                    clean += remaining
                if clean:
                    yield TextDelta(clean)
                elif combined:
                    yield TextDelta(combined)
                yield MessageStop(turn)
                return

            except AnthropicError as exc:
                last_error = exc
                is_server_error = exc.status_code is not None and exc.status_code >= 500
                if is_server_error and attempt < _MAX_RETRIES - 1:
                    delay = min(_RETRY_BASE_DELAY * (2 ** attempt), 15.0)
                    logger.warning("llm_retry", attempt=attempt, status=exc.status_code, delay=delay, error=str(exc))
                    await asyncio.sleep(delay)
                    continue
                # Rate limits: fail fast — don't make user wait minutes
                raise

        raise AnthropicError(f"LLM failed after {_MAX_RETRIES} attempts: {last_error}")
