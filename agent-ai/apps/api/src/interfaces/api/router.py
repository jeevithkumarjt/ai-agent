from __future__ import annotations

from fastapi import APIRouter

from .routes_admin import router as admin_router
from .routes_auth import router as auth_router
from .routes_chat import router as chat_router
from .routes_health import router as health_router
from .routes_sources import router as sources_router
from .routes_webhooks import router as webhooks_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(chat_router)
api_router.include_router(sources_router)
api_router.include_router(webhooks_router)
api_router.include_router(admin_router)
