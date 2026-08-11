from __future__ import annotations

import re
from dataclasses import dataclass

from rank_bm25 import BM25Okapi


class Tokenizer:
    _pattern = re.compile(r"[a-zA-Z0-9_+&.-]+")

    def tokenize(self, text: str) -> list[str]:
        return self._pattern.findall(text.lower())


@dataclass
class KeywordCandidate:
    id: str
    text: str
    score: float
    payload: dict


class BM25KeywordIndex:
    """In-memory BM25 index over a corpus snapshot (tenant + source_version scoped).

    Built on demand from the chunk store and cached in Redis; deterministic and dependency-free.
    """

    def __init__(self) -> None:
        self._tokenizer = Tokenizer()

    def build(self, items: list[dict]) -> "BM25KeywordIndex":
        self._corpus = [self._tokenizer.tokenize(it["text"]) for it in items]
        self._ids = [it["id"] for it in items]
        self._texts = [it["text"] for it in items]
        self._payloads = [it.get("payload", {}) for it in items]
        self._bm25 = BM25Okapi(self._corpus) if self._corpus else None
        return self

    def search(self, query: str, *, top_k: int = 20) -> list[KeywordCandidate]:
        if self._bm25 is None:
            return []
        tokens = self._tokenizer.tokenize(query)
        if not tokens:
            return []
        scores = self._bm25.get_scores(tokens)
        ranked = sorted(range(len(self._ids)), key=lambda i: scores[i], reverse=True)[:top_k]
        return [
            KeywordCandidate(
                id=self._ids[i], text=self._texts[i], score=float(scores[i]), payload=self._payloads[i]
            )
            for i in ranked
            if scores[i] > 0
        ]
