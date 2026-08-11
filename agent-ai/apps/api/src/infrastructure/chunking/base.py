from __future__ import annotations

from dataclasses import dataclass

from infrastructure.parsers.base import ParsedDocument


@dataclass
class Chunk:
    text: str
    section_path: str
    heading: str | None
    char_offset: int
    sha256: str


class BaseChunker:
    min_chars: int = 600
    max_chars: int = 1600
    overlap_chars: int = 120

    def chunk(self, parsed: ParsedDocument) -> list[Chunk]:
        raise NotImplementedError

    @staticmethod
    def _sha256(text: str) -> str:
        import hashlib

        return hashlib.sha256(text.encode()).hexdigest()

    def _window(self, text: str, section_path: str, heading: str | None, base_offset: int) -> list[Chunk]:
        """Split text into size windows with overlap, on sentence boundaries when possible."""
        if len(text) <= self.max_chars:
            return [
                Chunk(
                    text=text.strip(),
                    section_path=section_path,
                    heading=heading,
                    char_offset=base_offset,
                    sha256=self._sha256(text.strip()),
                )
            ]
        chunks: list[Chunk] = []
        start = 0
        while start < len(text):
            end = min(start + self.max_chars, len(text))
            if end < len(text):
                boundary = text.rfind(". ", start, end)
                if boundary > start + self.min_chars * 0.5:
                    end = boundary + 1
            piece = text[start:end].strip()
            if piece:
                chunks.append(
                    Chunk(
                        text=piece,
                        section_path=section_path,
                        heading=heading,
                        char_offset=base_offset + start,
                        sha256=self._sha256(piece),
                    )
                )
            if end >= len(text):
                break
            start = end - self.overlap_chars
        return chunks
