"""FastAPI application factory — wires routes, middleware, and app services.

App services live on app.state so routes stay dependency-injectable:
  app.state.orchestrator — Orchestrator (tool loop, ADR-002)
  app.state.portal      — admin portal service (documents, settings, audit, …)
"""
from __future__ import annotations

import asyncio
import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager, suppress
from pathlib import Path

from api import auth, conversations, health, knowledge
from api.admin import admin_router
from core.anthropic_client import AnthropicClient, AnthropicError
from core.embeddings import get_embedder
from core.logging import get_logger, setup_logging
from core.rate_limit import RateLimitMiddleware
from core.settings import settings
from db.admin_models import AdminBase
from db.session import engine
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from starlette.datastructures import Headers
from starlette.responses import Response
from services.knowledge import KnowledgeStore
from services.orchestrator import Orchestrator
from services.portal import PortalService
from services.rag import RagService
from services.tools.base import BaseTool, build_tool_map
from services.tools.search_knowledge_base import SearchKnowledgeBaseTool

logger = get_logger("app")

# Frontend pages served by the API itself (same-origin → no CORS issues).
# Only whitelisted files are exposed; never the repo root (secrets stay private).
PUBLIC_DIR = Path(__file__).resolve().parents[1] / "public"
_PUBLIC_FILES = {
    "": "index.html",
    "index.html": "index.html",
    "main.html": "main.html",
    "privacy.html": "privacy.html",
    "admin-ai.html": "admin-ai.html",
    "api-config.js": "api-config.js",
}

_DEFAULT_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "https://jeevithkumarjt.github.io",
]
# Override via CORS_ORIGINS (comma-separated) in hosted environments.
ALLOWED_ORIGINS = (
    [o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()]
    if os.environ.get("CORS_ORIGINS")
    else _DEFAULT_ORIGINS
)


class PrivateNetworkAccessMiddleware:
    """Allow HTTPS pages (e.g. GitHub Pages) on a public origin to call the
    local backend at http://127.0.0.1:<port>. Chrome/Edge enforce the PNA
    handshake: the preflight must carry Access-Control-Allow-Private-Network.
    Registered OUTSIDE the CORS middleware so it also answers the PNA
    preflight before the regular CORS preflight handling.
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        headers = Headers(scope=scope)
        origin = headers.get("origin")
        if not origin:
            return await self.app(scope, receive, send)

        if scope["method"] == "OPTIONS" and headers.get(
            "access-control-request-private-network"
        ):
            response = Response(status_code=200)
            response.headers.update(
                {
                    "access-control-allow-origin": origin,
                    "access-control-allow-methods": "DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT",
                    "access-control-allow-headers": "*",
                    "access-control-allow-credentials": "true",
                    "access-control-allow-private-network": "true",
                    "access-control-max-age": "600",
                    "vary": "Origin, Access-Control-Request-Headers, Access-Control-Request-Method",
                }
            )
            return await response(scope, receive, send)

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                message = {
                    **message,
                    "headers": [
                        *message.get("headers", []),
                        (b"access-control-allow-private-network", b"true"),
                    ],
                }
            await send(message)

        return await self.app(scope, receive, send_wrapper)


def create_app() -> FastAPI:
    setup_logging(level="DEBUG" if settings.debug else "INFO")

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        await _ensure_admin_tables()
        _build_services(app)
        from db.session import async_session_factory
        async with async_session_factory() as session:
            with suppress(Exception):
                await app.state.portal.apply_runtime_knowledge_settings(session)
        logger.info("app_started", env=settings.app_env, model=settings.anthropic_model)
        knowledge_task = asyncio.create_task(_knowledge_refresh_loop(app.state.knowledge))
        sync_task = asyncio.create_task(_auto_sync_loop(app))
        yield
        knowledge_task.cancel()
        sync_task.cancel()
        with suppress(asyncio.CancelledError):
            await knowledge_task
            await sync_task

    app = FastAPI(title="Enterprise AI Agent", version="1.0.0", lifespan=lifespan)

    app.add_middleware(RateLimitMiddleware)  # ADR-008 no-op seam
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(PrivateNetworkAccessMiddleware)

    app.include_router(health.router)
    app.include_router(auth.router)
    app.include_router(conversations.router)
    app.include_router(knowledge.router)
    app.include_router(admin_router)

    from api.tenant import router as tenant_router
    app.include_router(tenant_router)

    # Static frontend pages — registered last, so API/ docs routes win.
    @app.get("/{file_path:path}", include_in_schema=False, response_model=None)
    async def serve_static(file_path: str):
        if file_path in _PUBLIC_FILES:
            return FileResponse(PUBLIC_DIR / _PUBLIC_FILES[file_path])
        return JSONResponse({"detail": "Not Found"}, status_code=404)

    return app


async def _ensure_admin_tables() -> None:
    """Create admin-portal tables (dedicated registry) without touching the
    alembic-managed core schema."""
    async with engine.begin() as conn:
        await conn.run_sync(AdminBase.metadata.create_all)


async def _knowledge_refresh_loop(store: KnowledgeStore) -> None:
    """Refresh documents/ + site crawl at startup, then periodically in background."""
    await asyncio.to_thread(store.refresh)
    while True:
        await asyncio.sleep(settings.knowledge_refresh_minutes * 60)
        await asyncio.to_thread(store.refresh)


async def _auto_sync_loop(app: FastAPI) -> None:
    """Respect the portal's auto-sync interval (0 = disabled). Refreshes the
    in-process knowledge store on the shortest enabled interval across tenants."""
    from db.admin_models import AdminSetting
    from db.session import async_session_factory
    from sqlalchemy import select

    while True:
        try:
            async with async_session_factory() as session:
                rows = (await session.scalars(select(AdminSetting).where(AdminSetting.key == "auto_sync_minutes"))).all()
            enabled = [(int(r.value) if r.value else 0) for r in rows]
        except Exception:
            enabled = []
        shortest = min((value for value in enabled if value > 0), default=0)
        if shortest > 0:
            await asyncio.to_thread(app.state.knowledge.refresh)
            await asyncio.sleep(max(60, shortest * 60))
        else:
            await asyncio.sleep(60)


def _build_services(app: FastAPI) -> None:
    try:
        if settings.llm_provider == "groq":
            from core.openai_compat_client import OpenAICompatClient

            llm = OpenAICompatClient()
        else:
            llm = AnthropicClient()
    except AnthropicError as exc:
        raise RuntimeError(f"failed to initialize LLM client: {exc}") from exc

    rag = RagService(get_embedder())
    tools: dict[str, BaseTool] = build_tool_map([SearchKnowledgeBaseTool(rag)])
    knowledge = KnowledgeStore(docs_dir=Path(settings.knowledge_docs_dir))
    portal = PortalService(rag, knowledge)
    langgraph_agent = None
    if settings.use_langgraph:
        from services.langgraph_agent import LangGraphAgent

        try:
            langgraph_agent = LangGraphAgent(tools, knowledge=knowledge)
        except ValueError as exc:
            logger.warning("langgraph_disabled", error=str(exc))
            langgraph_agent = None
    app.state.knowledge = knowledge
    app.state.portal = portal
    app.state.orchestrator = Orchestrator(llm, tools, knowledge=knowledge, portal=portal, langgraph=langgraph_agent)


app = create_app()
