"""Liveness probe (api/openapi.yaml: /v1/health).

Public endpoint — safe for landing pages to poll for truthful status badges.
"""
from __future__ import annotations

from fastapi import APIRouter

from api.schemas import Health
from core.settings import settings

router = APIRouter(prefix="/v1/health", tags=["health"])


@router.get("", response_model=Health)
async def health() -> Health:
    return Health(
        status="ok",
        provider=settings.llm_provider,
        model=settings.anthropic_model,
        embeddings=bool(settings.embeddings_api_key),
        embeddings_model=settings.embeddings_model if settings.embeddings_api_key else None,
    )
