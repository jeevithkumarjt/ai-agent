#!/usr/bin/env python
"""Seed the golden question dataset into Postgres.

Usage:
    python scripts/seed_golden.py --json tests/eval/golden_questions.json [--tenant <uuid>]
"""
from __future__ import annotations

import argparse
import asyncio
import json
import uuid


async def main(path: str, tenant_id: str | None) -> None:
    import sys
    import os

    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "apps", "api", "src"))

    from db.session import SessionFactory
    from domain.models import GoldenQuestion
    from infrastructure.repository.source_repo import TenantRepository

    with open(path, encoding="utf-8") as f:
        questions = json.load(f)

    async with SessionFactory() as session:
        tenant = await TenantRepository(session).get_or_create(name="Default", slug="default")
        await session.flush()
        tid = uuid.UUID(tenant_id) if tenant_id else tenant.id
        for q in questions:
            row = GoldenQuestion(
                tenant_id=tid,
                question=q["question"],
                answer_fragments=q.get("answer_fragments", []),
                source_url=q.get("source_url"),
                category=q.get("category", "general"),
                active=True,
            )
            session.add(row)
        await session.commit()
    print(f"seeded {len(questions)} golden questions")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", default="tests/eval/golden_questions.json")
    parser.add_argument("--tenant", default=None)
    args = parser.parse_args()
    asyncio.run(main(args.json, args.tenant))
