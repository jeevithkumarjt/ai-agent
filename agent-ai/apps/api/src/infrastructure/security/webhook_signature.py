from __future__ import annotations

import hashlib
import hmac
import time

from config import settings
from domain.errors import UnauthorizedError


def verify_webhook_signature(raw_body: bytes, signature: str | None, timestamp: str | None) -> None:
    if not signature or not timestamp:
        raise UnauthorizedError("missing webhook signature")
    try:
        if abs(int(time.time()) - int(timestamp)) > 300:
            raise UnauthorizedError("webhook timestamp too old")
    except ValueError as exc:
        raise UnauthorizedError("invalid webhook timestamp") from exc
    expected = hmac.new(
        settings.webhook_secret.encode(), f"{timestamp}.".encode() + raw_body, hashlib.sha256
    ).hexdigest()
    if not hmac.compare_digest(signature, f"sha256={expected}"):
        raise UnauthorizedError("invalid webhook signature")
