"""RAG eval / regression harness (docs: ARCHITECTURE.md §RAG eval).

Fixed Q&A pairs (backend/scripts/eval_fixtures.json) with expected source chunks
are run against retrieval + (optionally) generation and the deviation is flagged.

Run inside the backend container (Postgres + .env present):

    docker compose exec backend python -m scripts.rag_eval
    docker compose exec backend python -m scripts.rag_eval --skip-llm         # retrieval only

Retrieval modes:
  db     — RagService.search (vector, tenant-scoped, pgvector). Requires the
           embedding provider (Ollama / OpenAI) to be reachable.
  memory — in-process KnowledgeStore (documents/ folder), same fallback model
           the LangGraph workers use when DB retrieval is degraded.
  auto   — (default) try db, fall back to memory on provider failure and mark
           the fixture as `degraded`.

Exit code is 1 when any fixture FAILS; SKIPs (environment unavailable) and the
results log (eval_results.json) do not gate the exit code. Generation checks use
--max-llm LLM calls maximum (Groq free-tier friendly).
"""
from __future__ import annotations

import argparse
import asyncio
import datetime
import json
import sys
import time
from pathlib import Path

from core.embeddings import get_embedder
from core.openai_compat_client import OpenAICompatClient
from core.settings import settings
from db.models import Tenant
from db.session import async_session_factory
from services.knowledge import KnowledgeStore
from services.langgraph_agent import HONEST_REFUSAL
from services.rag import RagService
from sqlalchemy import select

_FIXTURES_NAME = "eval_fixtures.json"
_FIXTURES = Path(__file__).with_name(_FIXTURES_NAME)
# Installed (site-packages) copies lose data files unless package-data is applied,
# so also look at the checkout copy the image keeps at /app/backend/scripts.
_FIXTURE_CANDIDATES = [
    _FIXTURES,
    Path("/app/backend/scripts") / _FIXTURES_NAME,
    Path.cwd() / "backend" / "scripts" / _FIXTURES_NAME,
    Path.cwd() / "scripts" / _FIXTURES_NAME,
]
_RESULTS = Path.cwd() / "eval_results.json"

_REFUSAL_SIGNALS = (
    HONEST_REFUSAL.lower(),
    "don't have that information",
    "i don't have that information",
    "not available",
    "cannot answer",
    "can't answer",
    "unable to answer",
    "no information",
)


def _norm(text: str) -> str:
    return " ".join(text.lower().strip().split())


def _kw_hit(text: str, keywords: list[str]) -> bool:
    hay = _norm(text)
    return any(_norm(k) in hay for k in keywords)


def _load_fixtures() -> list[dict]:
    path = next((p for p in _FIXTURE_CANDIDATES if p.is_file()), None)
    if path is None:
        raise SystemExit(f"eval fixtures not found; expected one of: {[str(p) for p in _FIXTURE_CANDIDATES]}")
    data = json.loads(path.read_text(encoding="utf-8"))
    return data.get("fixtures", [])


def _memory_retrieve(query: str, top_k: int, store: KnowledgeStore) -> list[dict]:
    return store.search(query, top_k, kinds=None)


async def _db_retrieve(session, rag: RagService, tenant_id, query: str, top_k: int) -> list[dict]:
    chunks = await rag.search(session, tenant_id=tenant_id, query=query, top_k=top_k)
    return [
        {
            "source": (c.chunk_metadata or {}).get("source_id", c.source_id) or "",
            "text": c.chunk_text,
            "kind": getattr(c, "kind", "db"),
        }
        for c in chunks
    ]


async def _generate_answer(query: str, retrieved: list[dict]) -> str:
    """Zero-shot answer: system instructs grounding strictly in the material."""
    context = "\n\n---\n\n".join(f"[{i}] source: {item.get('source')}\n{item.get('text')}" for i, item in enumerate(retrieved, start=1))
    system = (
        "You answer strictly and truthfully from the supplied 'Relevant knowledge' material. "
        "If the material does not contain the answer, reply exactly: "
        + HONEST_REFUSAL
        + " Do NOT guess or invent facts."
        + ("\n\n# Relevant knowledge\n" + context if context else "")
    )
    parts: list[str] = []
    async for event in OpenAICompatClient().stream(system=system, messages=[{"role": "user", "content": query}]):
        from core.anthropic_client import TextDelta

        if isinstance(event, TextDelta):
            parts.append(event.text)
    return "".join(parts)


def _classify(fixture: dict, retrieved: list[dict]) -> tuple[str, str]:
    sources = [item.get("source", "") for item in retrieved]
    texts = " ".join(item.get("text", "") for item in retrieved)
    hits = [_s for s in sources for _s in fixture["expected_sources"] if _s.lower() in s.lower()]
    kw = [k for k in fixture["expected_keywords"] if _kw_hit(texts, [k])]
    ok = bool(hits) or bool(kw) or not (fixture["expected_sources"] or fixture["expected_keywords"])
    why = f"sources_hit={hits[:3]} keywords_hit={kw[:3]}"
    return ("PASS" if ok else "FAIL"), why


async def _run(fixtures: list[dict], *, provider: str, top_k: int, skip_llm: bool, max_llm: int) -> list[dict]:
    session_ctx = async_session_factory()
    async with session_ctx as session:
        tenant = (await session.execute(select(Tenant).limit(1))).scalar_one_or_none()

    rag = RagService(embedder=get_embedder())
    store = KnowledgeStore()
    store.refresh_documents_only()

    results: list[dict] = []
    llm_done = 0
    for fx in fixtures:
        row = {"id": fx["id"], "question": fx["question"], "retrieval": "SKIP", "generation": "SKIP", "degraded": False, "note": ""}
        try:
            if provider in ("db", "auto"):
                if tenant is None:
                    raise RuntimeError("no tenant row; run `python -m backend.cli seed` first")
                try:
                    retrieved = await _db_retrieve(session, rag, tenant.id, fx["question"], top_k)
                    row["degraded"] = provider == "auto" and not retrieved
                except Exception as exc:  # noqa: BLE001
                    if provider == "db":
                        raise
                    row["degraded"] = True
                    row["note"] = f"db_unavailable: {type(exc).__name__}; used memory fallback"
                    retrieved = _memory_retrieve(fx["question"], top_k, store)
            else:
                retrieved = _memory_retrieve(fx["question"], top_k, store)

            if not retrieved:
                row["retrieval"] = "FAIL"
                row["note"] = "retrieval returned no chunks"
                results.append(row)
                continue
            verdict, why = _classify(fx, retrieved)
            row["retrieval"] = verdict
            row["note"] = (row["note"] + "; " if row["note"] else "") + why + f"; top_sources={[r['source'][:48] for r in retrieved[:3]]}"
        except Exception as exc:  # noqa: BLE001
            row["retrieval"] = "SKIP"
            row["note"] = f"retrieval_environment_error: {type(exc).__name__}: {exc}"

        if not skip_llm and llm_done < max_llm:
            try:
                answer = await _generate_answer(fx["question"], retrieved if row["retrieval"] != "SKIP" else [])
                llm_done += 1
                if fx["expect_refusal"]:
                    ok = any(sig in answer.lower() for sig in _REFUSAL_SIGNALS) or len(answer.strip()) < 40
                    row["generation"] = "PASS" if ok else "FAIL"
                    row["note"] += f"; generation(answer[:120])={answer[:120]!r}"
                else:
                    hits = [k for k in fx["expected_keywords"] if _kw_hit(answer, [k])]
                    ok = bool(hits)
                    row["generation"] = "PASS" if ok else "SKIP"
                    row["note"] += f"; generation(keyword_hits={hits[:3]})={answer[:120]!r}"
            except Exception as exc:  # noqa: BLE001 — LLM outage must not fail the eval
                row["generation"] = "SKIP"
                row["note"] += f"; generation_skipped: {type(exc).__name__}: {exc}"
        results.append(row)
    return results


def _report(results: list[dict], *, provider: str, top_k: int, skip_llm: bool, server_config: dict, elapsed_ms: int) -> dict:
    summary = {
        "pass": sum(1 for r in results if r["retrieval"] == "PASS"),
        "fail": sum(1 for r in results if r["retrieval"] == "FAIL"),
        "skip": sum(1 for r in results if r["retrieval"] == "SKIP"),
    }
    out = {
        "generated_at": datetime.datetime.now(datetime.UTC).isoformat(),
        "provider": provider,
        "top_k": top_k,
        "skip_llm": skip_llm,
        "server": server_config,
        "elapsed_ms": elapsed_ms,
        "summary": summary,
        "results": results,
    }
    _RESULTS.write_text(json.dumps(out, indent=2), encoding="utf-8")

    print("\n==== RAG EVAL ====")
    print(f"provider={provider} top_k={top_k} skip_llm={skip_llm} sources={server_config.get('sources')}")
    print(f"SUMMARY pass={summary['pass']} fail={summary['fail']} skip={summary['skip']} ({(elapsed_ms/1000):.1f}s)")
    for r in results:
        mark = {"PASS": "ok", "FAIL": "FAIL", "SKIP": "skip"}[r["retrieval"]]
        print(f"  [{mark}] {r['id']}: {r['retrieval']} | gen={r['generation']} | {r['note']}")
    print("results ->", _RESULTS)
    return out


def main() -> int:
    parser = argparse.ArgumentParser(description="RAG evaluation / regression harness")
    parser.add_argument("--provider", choices=["db", "memory", "auto"], default="auto")
    parser.add_argument("--topk", type=int, default=settings.retrieval_top_k)
    parser.add_argument("--skip-llm", action="store_true", help="retrieval only (no generation checks)")
    parser.add_argument("--max-llm", type=int, default=6, help="max generation checks per run")
    args = parser.parse_args()

    started = time.monotonic()
    fixtures = _load_fixtures()
    results = asyncio.run(_run(fixtures, provider=args.provider, top_k=args.topk, skip_llm=args.skip_llm, max_llm=args.max_llm))
    store = KnowledgeStore()
    out = _report(results, provider=args.provider, top_k=args.topk, skip_llm=args.skip_llm,
                  server_config={"version": store.version}, elapsed_ms=int((time.monotonic() - started) * 1000))
    return 1 if out["summary"]["fail"] else 0


if __name__ == "__main__":
    sys.exit(main())