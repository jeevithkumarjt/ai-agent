from __future__ import annotations

from math import pow


def reciprocal_rank_fusion(ranked_lists: list[list[dict]], *, k: int = 60) -> list[dict]:
    """Fuse multiple ranked lists of {id, score, payload} via Reciprocal Rank Fusion.

    IDs are the primary key; scores from different modalities are incomparable, ranks are not.
    """
    fused: dict[str, dict] = {}
    for ranked in ranked_lists:
        for rank, item in enumerate(ranked, start=1):
            item_id = item["id"]
            if item_id not in fused:
                fused[item_id] = {"id": item_id, "payload": item.get("payload", {}), "rrf": 0.0, "sources": []}
            fused[item_id]["rrf"] += 1.0 / (k + rank)
            fused[item_id]["sources"].append(item.get("source", "unknown"))
    ordered = sorted(fused.values(), key=lambda d: d["rrf"], reverse=True)
    for item in ordered:
        item["score"] = item["rrf"]
    return ordered
