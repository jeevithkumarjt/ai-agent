from __future__ import annotations

from .base import BaseParser, ParsedDocument, ParsedSection


class TXTParser(BaseParser):
    content_type = "text/plain"

    async def parse(self, raw: bytes, *, url: str | None = None) -> ParsedDocument:
        text = raw.decode("utf-8", errors="replace")
        return ParsedDocument(
            title=None,
            lang=None,
            content_type=self.content_type,
            sections=[ParsedSection("/", None, text.strip())],
        )
