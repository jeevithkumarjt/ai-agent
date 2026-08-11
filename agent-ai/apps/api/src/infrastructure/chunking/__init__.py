from __future__ import annotations

from config import settings
from infrastructure.parsers.base import ParsedDocument

from .base import BaseChunker, Chunk
from .fixed import FixedChunker, SemanticChunker
from .heading import HeadingChunker


def make_chunker(strategy: str | None = None) -> BaseChunker:
    chosen = strategy or settings.chunk_strategy
    cls: type[BaseChunker]
    if chosen == "semantic":
        cls = SemanticChunker
    elif chosen == "fixed":
        cls = FixedChunker
    else:
        cls = HeadingChunker
    return cls()


def chunk_document(parsed: ParsedDocument) -> list[Chunk]:
    chunker = make_chunker()
    chunker.min_chars = settings.chunk_min_chars
    chunker.max_chars = settings.chunk_max_chars
    chunker.overlap_chars = settings.chunk_overlap_chars
    return chunker.chunk(parsed)
