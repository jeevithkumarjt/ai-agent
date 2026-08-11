from __future__ import annotations

"""Sync-friendly bridge so Celery tasks can drive the async application layer.

Each task runs inside a fresh event loop (asyncio.run), builds a fresh async session scope,
and is fully idempotent so redelivery is safe.
"""

import asyncio
from contextlib import asynccontextmanager
from typing import AsyncIterator


@asynccontextmanager
async def async_app() -> AsyncIterator:
    from db.session import SessionFactory

    async with SessionFactory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


def run_async(coro_factory):
    return asyncio.run(coro_factory())
