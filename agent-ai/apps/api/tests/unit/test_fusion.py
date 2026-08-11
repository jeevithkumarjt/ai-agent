from __future__ import annotations

from infrastructure.search.fusion import reciprocal_rank_fusion
from infrastructure.search.mmr import mmr_select


def _list(start: int, ids: list[str], text: str = "x" * 40) -> list[dict]:
    return [
        {"id": i, "score": 1.0 - (start + rank) / 100.0, "payload": {"text": text}, "source": "dense"}
        for rank, i in enumerate(ids)
    ]


def test_rrf_fuses_and_orders() -> None:
    dense = _list(0, ["a", "b", "c", "d"])
    sparse = _list(1, ["d", "b", "e"])
    fused = reciprocal_rank_fusion([dense, sparse], k=60)
    assert [item["id"] for item in fused[:3]] == ["b", "d", "a"]
    assert all("rrf" in item for item in fused)


def test_rrf_empty() -> None:
    assert reciprocal_rank_fusion([]) == []
    assert reciprocal_rank_fusion([[]]) == []


def test_mmr_diversifies() -> None:
    items = [
        {"id": f"{i}", "score": 1.0 - i / 100.0, "text": "tryvium ai voice agents for customer service " * 3}
        for i in range(10)
    ]
    # make the top item's text distinct so MMR is forced to pick different content
    items[0]["text"] = "completely unrelated phrase about billing invoices and contracts"
    selected = mmr_select(items, lambda_param=0.7, top_k=4)
    assert len(selected) == 4
    assert selected[0]["id"] == "0"
    assert len({s["id"] for s in selected}) == 4
