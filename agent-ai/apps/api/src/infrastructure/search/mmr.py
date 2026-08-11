from __future__ import annotations


def mmr_select(items: list[dict], *, lambda_param: float = 0.7, top_k: int = 8) -> list[dict]:
    """Maximal Marginal Relevance — balance relevance against diversity of selected chunks.

    `items` must contain a `score` (relevance) and a `text` (for similarity). O(n^2) over a small
    candidate set (≤ 40) is acceptable.
    """
    if not items:
        return []
    import heapq
    from difflib import SequenceMatcher

    def sim(a: str, b: str) -> float:
        return SequenceMatcher(None, a[:2000], b[:2000]).ratio()

    selected: list[dict] = []
    remaining = list(items)
    first = max(remaining, key=lambda x: x["score"])
    remaining.remove(first)
    selected.append(first)

    while len(selected) < top_k and remaining:
        best = None
        best_mmr = float("-inf")
        for cand in remaining:
            sim_max = max(sim(cand.get("text", ""), s.get("text", "")) for s in selected)
            mmr = lambda_param * cand["score"] - (1 - lambda_param) * sim_max
            if mmr > best_mmr:
                best_mmr = mmr
                best = cand
        if best is None:
            break
        remaining.remove(best)
        selected.append(best)
    return selected
