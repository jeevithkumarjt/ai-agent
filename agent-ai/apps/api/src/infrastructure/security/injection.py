from __future__ import annotations

from config import settings
from logging import get_logger

logger = get_logger("security.injection")

_IGNORE_HINTS = (
    "ignore previous instructions",
    "ignore all previous",
    "system prompt",
    "you are now",
    "do not follow",
    "disregard",
    "new instructions",
    "forget your",
    "play a role",
    "jailbreak",
    "dan mode",
    "developer mode",
    "gtp mode",
)

_RETRIEVED_IGNORE_HINTS = (
    _IGNORE_HINTS
    + (
        "pretend to be",
        "simulate",
        "output your",
        "reveal your",
        "print your",
        "instructions in this",
    )
)


def score_injection(text: str, *, source: str = "user") -> float:
    """Heuristic injection score 0..1. 1 = definitely adversarial."""
    lowered = text.lower()
    score = 0.0
    hints = _IGNORE_HINTS if source == "user" else _RETRIEVED_IGNORE_HINTS
    for hint in hints:
        if hint in lowered:
            score += 0.2
    if source == "user":
        if text.count("(") > 3 and text.count(")") > 3:
            score += 0.1
        if any(marker in lowered for marker in ("<system>", "<instructions>", "</instructions>")):
            score += 0.3
    return min(score, 1.0)


def is_adversarial(text: str, *, source: str = "user") -> bool:
    if not settings.prompt_injection_scanner_enabled:
        return False
    score = score_injection(text, source=source)
    if score >= 0.6:
        logger.warning("prompt_injection_blocked", source=source, score=score)
        return True
    return False
