"""CLI helpers (source deliverable — no Docker/Node required to run).

Usage:
  python -m backend.cli seed                          Bootstrap tenant + owner (settings.BOOTSTRAP_*)
  python -m backend.cli ingest --path ./kb_src        Ingest file or directory into the knowledge base
                               [--tenant <tenant-id>] Defaults to the first tenant (single-tenant dev)
"""
from __future__ import annotations

import argparse
import asyncio
import pathlib
import uuid

from core.embeddings import get_embedder
from core.logging import get_logger, setup_logging
from core.security import hash_password
from core.settings import settings
from db.models import Tenant, User
from db.session import async_session_factory
from services.rag import RagService
from sqlalchemy import select

logger = get_logger("cli")

SUPPORTED_SUFFIXES = {".md", ".markdown", ".txt", ".rst", ".html"}


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="backend.cli", description="Enterprise AI Agent CLI")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("seed", help="Create bootstrap tenant + owner user")

    ingest = sub.add_parser("ingest", help="Embed + store a knowledge source (file or directory)")
    ingest.add_argument("--path", required=True, help="File or directory to ingest")
    ingest.add_argument("--tenant", type=uuid.UUID, default=None, help="Tenant to scope chunks to (default: first)")
    return parser


async def seed() -> None:
    async with async_session_factory() as session:
        existing = await session.scalar(
            select(User).join(Tenant, User.tenant_id == Tenant.id).where(User.email == settings.bootstrap_owner_email)
        )
        if existing is not None:
            logger.warning("seed_skipped", reason="owner email already exists", email=settings.bootstrap_owner_email)
            return

        tenant = Tenant(name=settings.bootstrap_tenant_name)
        session.add(tenant)
        await session.flush()
        session.add(
            User(
                tenant_id=tenant.id,
                email=settings.bootstrap_owner_email,
                role="owner",
                password_hash=hash_password(settings.bootstrap_owner_password),
            )
        )
        await session.commit()
        logger.info("seeded", tenant_id=str(tenant.id), owner=settings.bootstrap_owner_email)


def _collect_files(path: pathlib.Path) -> list[pathlib.Path]:
    if path.is_file():
        return [path]
    if path.is_dir():
        return sorted(p for p in path.rglob("*") if p.is_file() and p.suffix.lower() in SUPPORTED_SUFFIXES)
    return []


async def ingest(path: str, tenant: uuid.UUID | None) -> None:
    root = pathlib.Path(path)
    files = _collect_files(root)
    if not files:
        raise SystemExit(f"no supported files found under: {path}")

    rag = RagService(get_embedder())
    total_chunks = 0
    async with async_session_factory() as session:
        tenant_id = tenant or await _first_tenant_id(session)
        for file in files:
            text = file.read_text(encoding="utf-8", errors="replace")
            count = await rag.ingest_text(session, tenant_id=tenant_id, source_id=str(file), text=text)
            total_chunks += count
        logger.info("ingest_cli", tenant_id=str(tenant_id), files=len(files), chunks=total_chunks)


async def _first_tenant_id(session) -> uuid.UUID:
    tenant_id = await session.scalar(select(Tenant.id).limit(1))
    if tenant_id is None:
        raise SystemExit("no tenants exist — run `python -m backend.cli seed` first")
    return tenant_id


def main() -> None:
    setup_logging()
    args = build_parser().parse_args()
    if args.command == "seed":
        asyncio.run(seed())
    elif args.command == "ingest":
        asyncio.run(ingest(args.path, args.tenant))


if __name__ == "__main__":
    main()
