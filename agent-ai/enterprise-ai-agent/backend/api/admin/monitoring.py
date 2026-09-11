"""Admin monitor routes: agent routing observability (in-memory, recent only).

Backs the admin "Agent Routing" page so misrouting (supervisor supplied the
wrong specialist), reroutes (tool-heavy reply collapsed to a final answer) and
fallbacks (LangGraph failed → single-agent loop) are visible without grepping
application logs.
"""
from __future__ import annotations

from typing import Annotated

from core.rbac import SCOPE_ANALYTICS
from fastapi import APIRouter, Depends
from services.observability import recent

from api.admin.deps import Principal, require_scope

router = APIRouter(prefix="/monitoring", tags=["admin-monitoring"])


@router.get("/routing-log")
async def routing_log(
    principal: Annotated[Principal, Depends(require_scope(SCOPE_ANALYTICS))],
    limit: int = 100,
) -> dict:
    """Return the most recent agent-routing events, newest first."""
    return {"items": recent(limit=min(limit, 500))}