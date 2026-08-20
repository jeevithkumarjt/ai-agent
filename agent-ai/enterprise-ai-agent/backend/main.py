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

from api import auth, billing, conversations, health, knowledge
from api.admin import admin_router
from api.tenant import router as tenant_router
from core.anthropic_client import AnthropicClient, AnthropicError
from core.embeddings import get_embedder
from core.logging import get_logger, setup_logging
from core.rate_limit import RateLimitMiddleware
from core.settings import settings
from db.session import engine
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from services.knowledge import KnowledgeStore
from services.orchestrator import Orchestrator
from services.portal import PortalService
from services.rag import RagService
from services.tools.base import BaseTool, build_tool_map
from services.tools.search_knowledge_base import SearchKnowledgeBaseTool

logger = get_logger("app")

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


def create_app() -> FastAPI:
    setup_logging(level="DEBUG" if settings.debug else "INFO")

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        init_task = asyncio.create_task(_init_app(app))
        yield
        init_task.cancel()
        with suppress(asyncio.CancelledError):
            await init_task

    app = FastAPI(title="Enterprise AI Agent", version="1.0.0", lifespan=lifespan)

    app.add_middleware(RateLimitMiddleware)  # ADR-008 no-op seam
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router)
    app.include_router(auth.router)
    app.include_router(billing.router)
    app.include_router(tenant_router)
    app.include_router(conversations.router)
    app.include_router(knowledge.router)
    app.include_router(admin_router)
    return app


async def _ensure_tables() -> None:
    """Create tables if they don't exist. Timeout after 30s so startup isn't blocked."""
    from db.models import Base
    try:
        async with asyncio.timeout(30):
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
        logger.info("db_tables_ready")
    except Exception as exc:
        logger.warning("db_table_creation_skipped", error=str(exc))


async def _init_app(app: FastAPI) -> None:
    """Deferred initialization: DB tables, services, then background loops."""
    await _ensure_tables()
    _build_services(app)
    logger.info("app_started", env=settings.app_env, model=settings.anthropic_model)
    knowledge_task = asyncio.create_task(_safe_refresh(app.state.knowledge))
    sync_task = asyncio.create_task(_auto_sync_loop(app))
    try:
        await asyncio.gather(knowledge_task, sync_task)
    finally:
        knowledge_task.cancel()
        sync_task.cancel()
        with suppress(asyncio.CancelledError):
            await knowledge_task
            await sync_task


async def _safe_refresh(store: KnowledgeStore) -> None:
    """First refresh after 5 min delay; then periodic per knowledge_refresh_minutes."""
    await asyncio.sleep(300)
    try:
        await store.refresh()
    except Exception:
        logger.exception("knowledge_refresh_error")
    while True:
        await asyncio.sleep(settings.knowledge_refresh_minutes * 60)
        try:
            await store.refresh()
        except Exception:
            logger.exception("knowledge_refresh_error")


async def _auto_sync_loop(app: FastAPI) -> None:
    """Respect the portal's auto-sync interval (0 = disabled). Re-ingests the
    knowledge store on the shortest enabled interval across tenants."""
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
            await app.state.knowledge.refresh()
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
    knowledge = KnowledgeStore(docs_dir=Path(settings.knowledge_docs_dir), embedder=rag.embedder)
    portal = PortalService(rag, knowledge)
    app.state.knowledge = knowledge
    app.state.portal = portal
    app.state.orchestrator = Orchestrator(llm, tools, rag=rag, portal=portal)


app = create_app()
