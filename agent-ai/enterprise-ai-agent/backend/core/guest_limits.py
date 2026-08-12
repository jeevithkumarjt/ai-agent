"""Server-side enforcement for anonymous demo sessions (ADR-005 extension).

Every guest token carries a signed per-visitor `sid`. Because all anonymous
visitors share one tenant-scoped guest user row, we track the message cap and
the per-session request budget in memory keyed on (tenant_id, sid) instead of
the shared user_id — otherwise one visitor would exhaust the budget for everyone.

The cap is authoritative server-side: past `guest_message_limit` sends the API
returns 403 `guest_message_limit_reached`, which the chat frontends translate
into a "sign in to keep going" gate. Limits reset on process restart, which is
acceptable for a public demo (the per-IP middleware still guards abuse).
"""
from __future__ import annotations

import threading
import time
import uuid
from collections import defaultdict

from core.settings import settings


class _GuestTrackers:
    def __init__(self) -> None:
        self._sent: dict[tuple[str, str], int] = defaultdict(int)
        self._hits: dict[str, list[float]] = defaultdict(list)
        self._lock = threading.Lock()

    def _window(self) -> float:
        return time.monotonic()

    def remaining(self, tenant_id: uuid.UUID, sid: str) -> int:
        with self._lock:
            return max(0, settings.guest_message_limit - self._sent[(str(tenant_id), sid)])

    def record_send(self, tenant_id: uuid.UUID, sid: str) -> int:
        """Increment the send counter. Returns the new count (0 = exceeded)."""
        with self._lock:
            key = (str(tenant_id), sid)
            self._sent[key] += 1
            return self._sent[key]

    def allow_rate(self, tenant_id: uuid.UUID, sid: str) -> bool:
        """Per-session requests-per-minute budget for guest chat traffic."""
        key = f"guest:{tenant_id}:{sid}"
        now = self._window()
        with self._lock:
            bucket = self._hits[key]
            bucket[:] = [t for t in bucket if t > now - 60]
            if len(bucket) >= settings.guest_requests_per_minute:
                return False
            bucket.append(now)
            return True


_trackers = _GuestTrackers()


def guest_message_remaining(tenant_id: uuid.UUID, sid: str) -> int:
    return _trackers.remaining(tenant_id, sid)


def record_guest_send(tenant_id: uuid.UUID, sid: str) -> int:
    return _trackers.record_send(tenant_id, sid)


def allow_guest_rate(tenant_id: uuid.UUID, sid: str) -> bool:
    return _trackers.allow_rate(tenant_id, sid)
