from __future__ import annotations

import json

from infrastructure.providers.llm.gateway import LLMGateway
from logging import get_logger

logger = get_logger("pipeline.multi_query")

_MULTI_SYSTEM = """Generate up to 3 alternative phrasings of the user's question to improve retrieval recall.

Each phrasing must use different wording but preserve the same meaning and intent.
Output ONLY a JSON array of strings, e.g. ["q1", "q2", "q3"]."""


async def multi_query_expand(gateway: LLMGateway, question: str, *, enabled: bool = True) -> list[str]:
    if not enabled:
        return [question]
    messages = [
        {"role": "system", "content": _MULTI_SYSTEM},
        {"role": "user", "content": question},
    ]
    try:
        completion = await gateway.complete(messages, role="fast", max_tokens=200)
        parsed = json.loads(completion.text.strip())
        variants = [str(v).strip() for v in parsed if isinstance(v, str) and v.strip()]
        if not variants:
            return [question]
        result = [question]
        for v in variants[:2]:
            if v.lower() != question.lower():
                result.append(v)
        return result[:3]
    except Exception as exc:
        logger.warning("multi_query_failed", error=str(exc))
        return [question]
