from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass
class ConfidenceInput:
    rerank_scores: list[float]
    agreement: float = 1.0  # 0..1 agreement across multi-query results
    freshness: float = 1.0  # 0..1 freshness decay
    chunk_density: float = 1.0
    source_reliability: float = 1.0


def _sigmoid(x: float) -> float:
    import math

    return 1.0 / (1.0 + math.exp(-x))


def confidence_score(inp: ConfidenceInput) -> float:
    """Calibrated confidence 0..1.

    Base = sigmoid of the max rerank score scaled to a useful band, adjusted by agreement,
    freshness, density and source reliability.
    """
    if not inp.rerank_scores:
        return 0.0
    top = max(inp.rerank_scores)
    base = _sigmoid((top - 0.1) * 8.0)
    score = base * inp.agreement * inp.freshness * inp.chunk_density * inp.source_reliability
    return round(min(max(score, 0.0), 1.0), 4)


def freshness_decay(published_at: datetime | None, *, half_life_days: float = 365.0) -> float:
    if published_at is None:
        return 1.0
    import math

    age_days = (datetime.now(timezone.utc) - published_at).total_seconds() / 86400.0
    if age_days <= 0:
        return 1.0
    return float(0.5 ** (age_days / half_life_days))
