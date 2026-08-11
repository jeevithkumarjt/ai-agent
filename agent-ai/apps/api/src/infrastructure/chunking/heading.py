from __future__ import annotations

from infrastructure.parsers.base import ParsedDocument

from .base import BaseChunker, Chunk


class HeadingChunker(BaseChunker):
    """Chunk by heading boundaries, then size-window each section."""

    def chunk(self, parsed: ParsedDocument) -> list[Chunk]:
        chunks: list[Chunk] = []
        for section in parsed.sections:
            chunks.extend(
                self._window(
                    section.text,
                    section.heading_path,
                    section.heading,
                    base_offset=0,
                )
            )
        return chunks
