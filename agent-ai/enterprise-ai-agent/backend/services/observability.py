"""In-process observability ring buffer for agent routing decisions.

Dependency-free, memory-only. Stores the most recent routing events
(supervisor route + raw classification, worker reroutes/refusals, single-agent
fallbacks) so misrouting and loops are visible via the admin "Agent Routing"
surface without grepping application logs. Events are dropped when the buffer
is full (newest wins) — this is a debugging aid, not an audit trail.
"""
from __future__ import annotations

import time
from collections import deque
from typing import Any

MAX_EVENTS = 500

_events: deque[dict[str, Any]] = deque(maxlen=MAX_EVENTS)


def record(**fields: Any) -> None:
    """Append one routing event. Missing/newer fields are allowed; callers never
    block or raise here — observability must never break chat."""
    _events.append({"ts": time.time(), **fields})


def recent(limit: int = 100) -> list[dict[str, Any]]:
    """Return the most recent events, newest first. Never raises."""
    return list(reversed(list(_events)[-max(1, min(limit, MAX_EVENTS)) :]))