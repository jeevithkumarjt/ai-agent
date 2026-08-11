"""Streaming transports — SSE (HTTP POST) and WebSocket (api/openapi.yaml).

Both transports emit the SAME event set (locked in 02-agent-and-rag-workflow.md):
  user_message | text_delta | tool_call_started | tool_call_completed | message_done | error
"""
from __future__ import annotations

import json
from typing import Any


def sse_event(event: dict[str, Any]) -> str:
    """Serialize an event dict as a single SSE data frame (event types are carried
    in the payload, so one frame per event is enough)."""
    return f"data: {json.dumps(event, separators=(',', ':'))}\n\n"
