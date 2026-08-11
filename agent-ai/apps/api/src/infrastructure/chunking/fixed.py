from __future__ import annotations

import re

from infrastructure.parsers.base import ParsedDocument

from .base import BaseChunker, Chunk


class FixedChunker(BaseChunker):
    """Pure fixed-size windowing, independent of structure."""

    def chunk(self, parsed: ParsedDocument) -> list[Chunk]:
        text = "\n\n".join(s.text for s in parsed.sections)
        return self._window(text, "/", None, 0)


class SemanticChunker(BaseChunker):
    """Chunk at paragraph/heading boundaries, merging short paragraphs up to min size.

    Simple deterministic semantic-ish splitting: keep paragraph structure, merge until
    min_chars reached, then flush on next paragraph boundary.
    """

    def chunk(self, parsed: ParsedDocument) -> list[Chunk]:
        chunks: list[Chunk] = []
        buffer: list[str] = []
        buffer_len = 0
        section_path = "/"
        heading = None

        def flush() -> None:
            nonlocal buffer, buffer_len
            text = "\n\n".join(buffer)
            if text.strip():
                chunks.extend(self._window(text, section_path, heading, 0))
            buffer = []
            buffer_len = 0

        for section in parsed.sections:
            section_path = section.heading_path
            heading = section.heading
            for para in re.split(r"\n\s*\n", section.text):
                para = para.strip()
                if not para:
                    continue
                if buffer_len + len(para) > self.max_chars and buffer:
                    flush()
                buffer.append(para)
                buffer_len += len(para) + 2
                if buffer_len >= self.min_chars:
                    flush()
        flush()
        return chunks
