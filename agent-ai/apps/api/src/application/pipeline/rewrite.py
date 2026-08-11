from __future__ import annotations

import json
import re

from infrastructure.providers.llm.gateway import LLMGateway
from logging import get_logger

logger = get_logger("pipeline.rewrite")

_REWRITE_SYSTEM = """You rewrite a user question to improve enterprise knowledge-base retrieval.

Rules:
- Expand abbreviations and product names to their full form used on the company site.
- Resolve pronouns if context is provided; otherwise leave unchanged.
- Add 1-3 likely domain keywords from the site's vocabulary.
- Output ONLY a JSON object: {"rewritten": "..."}"""


async def rewrite_query(
    gateway: LLMGateway,
    question: str,
    *,
    context: str | None = None,
    enabled: bool = True,
) -> str:
    if not enabled:
        return question
    messages = [
        {"role": "system", "content": _REWRITE_SYSTEM},
        {"role": "user", "content": question if not context else f"Context:\n{context}\n\nQuestion:\n{question}"},
    ]
    try:
        completion = await gateway.complete(messages, role="fast", max_tokens=160)
        parsed = json.loads(completion.text.strip())
        return str(parsed.get("rewritten", question))
    except Exception as exc:  # never fail the pipeline on rewrite errors
        logger.warning("rewrite_failed", error=str(exc))
        return question


def _expand_abbreviations(question: str) -> str:
    return question
