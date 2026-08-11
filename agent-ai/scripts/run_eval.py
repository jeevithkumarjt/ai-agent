#!/usr/bin/env python
"""Trigger a golden-dataset evaluation and report the result.

Usage:
    python scripts/run_eval.py --api http://localhost:8000 --token <admin-jwt> [--tenant <uuid>]
"""
from __future__ import annotations

import argparse
import asyncio
import time

import httpx


async def main(api: str, token: str) -> None:
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient(base_url=api, headers=headers, timeout=120) as client:
        resp = await client.post("/api/v1/admin/eval/run")
        resp.raise_for_status()
        run = resp.json()
        if run["status"] == "queued":
            print("eval queued asynchronously; watch /admin/eval/runs for results")
            return

        # If a synchronous run id is returned (worker), poll for completion.
        run_id = run.get("id")
        if not run_id:
            return
        for _ in range(120):
            time.sleep(5)
            resp = await client.get("/api/v1/admin/eval/runs")
            runs = resp.json()
            match = next((r for r in runs if r["id"] == run_id), None)
            if match and match["status"] == "completed":
                print(
                    f"eval {run_id}: overall={match['score_overall']} "
                    f"grounded={match['score_grounded']} citation={match['score_citation']} "
                    f"passed={match['passed']}"
                )
                return
            if match and match["status"] == "failed":
                raise SystemExit(f"eval failed: {match.get('details')}")
        raise SystemExit("eval timed out")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--api", default="http://localhost:8000")
    parser.add_argument("--token", required=True)
    args = parser.parse_args()
    asyncio.run(main(args.api, args.token))
