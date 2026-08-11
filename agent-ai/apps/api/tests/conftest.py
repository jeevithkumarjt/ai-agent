from __future__ import annotations

import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))


@pytest.fixture(scope="session", autouse=True)
def test_settings() -> None:
    os.environ.setdefault("APP_ENV", "test")
    os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://agentai:agentai@localhost:5432/agentai_test")
    os.environ.setdefault("REDIS_URL", "redis://localhost:6379/15")
    os.environ.setdefault("QDRANT_URL", "http://localhost:6333")
    os.environ.setdefault("EMBEDDING_PROVIDER", "fastembed")
    os.environ.setdefault("SECRET_KEY", "test-secret-key-0123456789")
    os.environ.setdefault("JWT_SECRET", "test-jwt-secret-0123456789")
    os.environ.setdefault("WEBHOOK_SECRET", "test-webhook-secret")
    os.environ.setdefault("CACHE_ENABLED", "false")
