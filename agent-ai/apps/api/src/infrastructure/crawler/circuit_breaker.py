from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass, field


@dataclass
class HostBreakerState:
    failures: int = 0
    opened_at: float | None = None
    cooldown: float = 30.0
    threshold: int = 5
    task: asyncio.Task | None = field(default=None, repr=False)

    @property
    def is_open(self) -> bool:
        if self.opened_at is None:
            return False
        if time.monotonic() - self.opened_at > self.cooldown:
            return False
        return True

    def record_failure(self) -> None:
        self.failures += 1
        if self.failures >= self.threshold:
            self.opened_at = time.monotonic()

    def record_success(self) -> None:
        self.failures = 0
        self.opened_at = None


class HostCircuitBreaker:
    """Per-host circuit breaker to avoid hammering a failing site."""

    def __init__(self, *, threshold: int = 5, cooldown: float = 30.0):
        self._states: dict[str, HostBreakerState] = {}
        self.threshold = threshold
        self.cooldown = cooldown

    def _state(self, host: str) -> HostBreakerState:
        state = self._states.setdefault(
            host, HostBreakerState(threshold=self.threshold, cooldown=self.cooldown)
        )
        return state

    def is_open(self, host: str) -> bool:
        return self._state(host).is_open

    def record_failure(self, host: str) -> None:
        self._state(host).record_failure()

    def record_success(self, host: str) -> None:
        self._state(host).record_success()

    def reset(self, host: str) -> None:
        self._states.pop(host, None)
