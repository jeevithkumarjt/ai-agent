from __future__ import annotations

import re

from config import settings
from logging import get_logger

logger = get_logger("security.pii")

_PATTERNS: list[tuple[str, str]] = [
    ("email", r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"),
    ("phone", r"\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b"),
    ("ssn", r"\b\d{3}-\d{2}-\d{4}\b"),
    ("credit_card", r"\b(?:\d[ -]?){13,16}\b"),
    ("ipv4", r"\b(?:\d{1,3}\.){3}\d{1,3}\b"),
    ("aws_key", r"\bAKIA[0-9A-Z]{16}\b"),
    ("github_token", r"\bghp_[A-Za-z0-9]{36}\b"),
]

_COMPILED = [(name, re.compile(p)) for name, p in _PATTERNS]


def scan(text: str) -> list[dict]:
    """Scan text for PII / secrets. Returns list of {type, match, start, end}."""
    findings: list[dict] = []
    for name, pattern in _COMPILED:
        for m in pattern.finditer(text):
            if name == "credit_card":
                if not _luhn(m.group()):
                    continue
            findings.append(
                {"type": name, "match": m.group(), "start": m.start(), "end": m.end()}
            )
    return findings


def redact(text: str) -> str:
    """Replace PII matches with placeholders for safe logging / context assembly."""
    for name, pattern in _COMPILED:
        if name in {"email", "phone", "ssn", "credit_card", "ipv4", "aws_key", "github_token"}:
            text = pattern.sub(f"<{name}>", text)
    return text


def _luhn(value: str) -> bool:
    digits = [int(c) for c in value if c.isdigit()]
    if len(digits) < 13:
        return False
    checksum = 0
    reverse = digits[::-1]
    for i, d in enumerate(reverse):
        if i % 2 == 1:
            d *= 2
            if d > 9:
                d -= 9
        checksum += d
    return checksum % 10 == 0


def scan_for_logging(text: str) -> None:
    """Emit a warning log when PII is detected (for audit), without logging the value."""
    if not settings.pii_scanner_enabled:
        return
    findings = scan(text)
    if findings:
        types = sorted({f["type"] for f in findings})
        logger.warning("pii_detected", types=types)
