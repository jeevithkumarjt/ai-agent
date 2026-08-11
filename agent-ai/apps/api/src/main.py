from __future__ import annotations

from contextlib import asynccontextmanager

import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from config import settings
from db.session import close_engine, engine
from db.redis import close_redis
from interfaces.api.errors import install_error_handlers
from interfaces.api.router import api_router
from interfaces.middleware.context import RequestContextMiddleware
from logging import get_logger, setup_logging

logger = get_logger("main")


def _init_sentry() -> None:
    if settings.sentry_dsn:
        sentry_sdk.init(
            dsn=settings.sentry_dsn,
            environment=settings.app_env,
            traces_sample_rate=settings.sentry_traces_sample_rate,
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging(settings.log_level)
    logger.info("app_starting", env=settings.app_env)
    from telemetry import init_telemetry

    init_telemetry()
    _init_sentry()

    # ensure tables + bootstrap tenant
    try:
        async with engine.begin() as conn:
            from domain.models import Base

            await conn.run_sync(Base.metadata.create_all)
        from db.session import SessionFactory
        from infrastructure.repository.source_repo import TenantRepository, UserRepository

        async with SessionFactory() as session:
            from application.services.auth_service import AuthService

            auth = AuthService(UserRepository(session), TenantRepository(session))
            await auth.bootstrap_default_tenant()
            await session.commit()
    except Exception as exc:  # allow startup to continue; health checks will surface issues
        logger.error("startup_init_failed", error=str(exc))

    yield

    await close_engine()
    await close_redis()
    logger.info("app_stopped")


def create_app() -> FastAPI:
    app = FastAPI(
        title="AgentAI API",
        version="1.0.0",
        description="Enterprise AI Knowledge Platform — grounded, cited, self-updating.",
        docs_url="/docs",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RequestContextMiddleware)

    install_error_handlers(app)
    app.include_router(api_router)

    if settings.metrics_enabled:
        Instrumentator(excluded_handlers=["/metrics"]).instrument(app).expose(app, endpoint="/metrics")

    @app.get("/", include_in_schema=False)
    async def root() -> dict:
        return {"service": "agentai-api", "status": "ok", "docs": "/docs"}

    return app


app = create_app()
