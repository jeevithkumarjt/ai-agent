from __future__ import annotations

import re

from infrastructure.security.injection import score_injection
from logging import get_logger

logger = get_logger("pipeline.ground")

_SENTENCE_SPLIT = re.compile(r"(?<=[.!?])\s+|\n+")
_WORD_SET = re.compile(r"[a-z0-9]+")


def extract_sentences(text: str) -> list[str]:
    return [s.strip() for s in _SENTENCE_SPLIT.split(text) if s.strip()]


def _lexical_overlap(sentence: str, chunk_text: str) -> float:
    sent_words = set(_WORD_SET.findall(sentence.lower()))
    if not sent_words:
        return 0.0
    chunk_words = set(_WORD_SET.findall(chunk_text.lower()))
    if not chunk_words:
        return 0.0
    return len(sent_words & chunk_words) / len(sent_words)


class GroundingVerifier:
    """Claim-level grounding: every sentence in the answer must be supported by retrieved context."""

    def __init__(self, *, threshold: float = 0.5):
        self.threshold = threshold

    def verify(self, answer: str, context_chunks: list[dict]) -> tuple[bool, list[str]]:
        unsupported: list[str] = []
        for sentence in extract_sentences(answer):
            # Skip short/structural sentences and headings that carry no claims.
            if len(sentence) < 24 or self._is_structural(sentence):
                continue
            best = max((_lexical_overlap(sentence, chunk.get("text", "")) for chunk in context_chunks), default=0.0)
            if best < self.threshold:
                unsupported.append(sentence)
        return (not unsupported), unsupported

    @staticmethod
    def _is_structural(sentence: str) -> bool:
        lowered = sentence.lower()
        return any(
            marker in lowered
            for marker in ("based on", "the sources", "according to", "citations", "i couldn't", "related")
        )

    def score(self, answer: str, context_chunks: list[dict]) -> float:
        sentences = [s for s in extract_sentences(answer) if len(s) >= 24 and not self._is_structural(s)]
        if not sentences:
            return 1.0
        supported = 0
        for s in sentences:
            best = max((_lexical_overlap(s, chunk.get("text", "")) for chunk in context_chunks), default=0.0)
            if best >= self.threshold:
                supported += 1
        return supported / len(sentences)


def sanitize_context_chunk(chunk_text: str) -> str:
    """Neutralize prompt-breaking constructs so crawled content can't inject instructions."""
    if score_injection(chunk_text, source="retrieved") >= 0.4:
        logger.info("context_chunk_neutralized")
    for marker in ("<system>", "</system>", "<instructions>", "</instructions>", "<assistant>", "<user>"):
        chunk_text = chunk_text.replace(marker, f"[{marker.strip('<>')}]")
    return chunk_text
