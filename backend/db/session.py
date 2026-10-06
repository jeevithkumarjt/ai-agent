"""Async SQLAlchemy engine/session + pydantic-settings wiring (ADR-001)."""
from __future__ import annotations

from collections.abc import AsyncGenerator

from core.settings import settings
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

engine = create_async_engine(settings.database_url, pool_pre_ping=True, echo=settings.debug)

async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session
