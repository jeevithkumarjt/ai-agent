from __future__ import annotations

import json

import pytest

from infrastructure.security.webhook_signature import verify_webhook_signature

WEBHOOK_SECRET = "test-webhook-secret"


def _sign(body: bytes, timestamp: str) -> str:
    import hashlib
    import hmac

    return "sha256=" + hmac.new(WEBHOOK_SECRET.encode(), f"{timestamp}.".encode() + body, hashlib.sha256).hexdigest()


def test_valid_signature_passes() -> None:
    body = b'{"url":"https://www.tryvium.ai/pricing"}'
    ts = "1700000000"
    from domain.errors import UnauthorizedError

    verify_webhook_signature(body, _sign(body, ts), ts)  # should not raise


def test_tampered_body_rejected() -> None:
    body = b'{"url":"https://www.tryvium.ai/pricing"}'
    ts = "1700000000"
    from domain.errors import UnauthorizedError

    with pytest.raises(UnauthorizedError):
        verify_webhook_signature(b'{"url":"https://evil.example.com"}', _sign(body, ts), ts)


def test_stale_timestamp_rejected() -> None:
    body = b"{}"
    ts = "1000000000"  # 2001
    from domain.errors import UnauthorizedError

    with pytest.raises(UnauthorizedError):
        verify_webhook_signature(body, _sign(body, ts), ts)


def test_missing_signature_rejected() -> None:
    from domain.errors import UnauthorizedError

    with pytest.raises(UnauthorizedError):
        verify_webhook_signature(b"{}", None, None)
