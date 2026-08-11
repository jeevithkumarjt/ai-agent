"""Admin portal routers — mounted under /v1/admin in main.py.

Every route is tenant-scoped and guarded by an RBAC scope (see core/rbac.py).
The frontend SPA (admin-ai.html) talks only to these endpoints.
"""
from __future__ import annotations

from fastapi import APIRouter

from api.admin import analytics, knowledge, system, unanswered, users

admin_router = APIRouter(prefix="/v1/admin", tags=["admin"])
admin_router.include_router(knowledge.router)
admin_router.include_router(unanswered.router)
admin_router.include_router(analytics.router)
admin_router.include_router(users.router)
admin_router.include_router(system.router)

__all__ = ["admin_router"]
