"""Liveness probe (api/openapi.yaml: /v1/health)."""
from __future__ import annotations

from fastapi import APIRouter

from api.schemas import Health

router = APIRouter(prefix="/v1/health", tags=["health"])


@router.get("", response_model=Health)
async def health() -> Health:
    return Health(status="ok")
