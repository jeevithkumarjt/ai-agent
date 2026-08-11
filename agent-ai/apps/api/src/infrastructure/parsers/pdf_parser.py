from __future__ import annotations

import io

from pypdf import PdfReader

from .base import BaseParser, ParsedDocument, ParsedSection


class PDFParser(BaseParser):
    content_type = "application/pdf"

    async def parse(self, raw: bytes, *, url: str | None = None) -> ParsedDocument:
        reader = PdfReader(io.BytesIO(raw))
        meta = reader.metadata or {}
        title = meta.get("title") or None
        sections: list[ParsedSection] = []
        for i, page in enumerate(reader.pages, start=1):
            text = page.extract_text() or ""
            if text.strip():
                sections.append(
                    ParsedSection(
                        heading_path=f"/page-{i}",
                        heading=f"Page {i}",
                        text=text.strip(),
                    )
                )
        return ParsedDocument(
            title=title,
            lang=None,
            content_type=self.content_type,
            sections=sections,
            metadata={"pages": len(reader.pages)},
        )
