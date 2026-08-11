"""Knowledge store status (dev/diagnostics) — surfaces what was ingested and when."""
from __future__ import annotations

from fastapi import APIRouter, Request

router = APIRouter(prefix="/v1/knowledge", tags=["knowledge"])


@router.get("/status")
async def knowledge_status(request: Request) -> dict:
    store = getattr(request.app.state, "knowledge", None)
    if store is None:
        return {"enabled": False}
    return {"enabled": True, **store.status()}
