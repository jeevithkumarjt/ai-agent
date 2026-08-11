from __future__ import annotations

from typing import Protocol

from .base import ParsedDocument
from .csv_parser import CSVParser
from .docx_parser import DOCXParser
from .html_parser import HTMLParser
from .markdown_parser import MarkdownParser
from .pdf_parser import PDFParser
from .txt_parser import TXTParser


class Parser(Protocol):
    async def parse(self, raw: bytes, *, url: str | None = None) -> ParsedDocument: ...


def content_type_of(raw: bytes, fallback: str | None = None) -> str:
    if raw.startswith(b"%PDF"):
        return "application/pdf"
    if raw.startswith(b"PK"):
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    if fallback:
        return fallback
    return "text/plain"


def parser_for(content_type: str) -> Parser:
    normalized = content_type.lower()
    if "html" in normalized or "xhtml" in normalized:
        return HTMLParser()
    if "markdown" in normalized or normalized in {"text/md", "text/x-markdown"}:
        return MarkdownParser()
    if "pdf" in normalized:
        return PDFParser()
    if "wordprocessingml" in normalized or normalized == "application/msword":
        return DOCXParser()
    if "csv" in normalized:
        return CSVParser()
    return TXTParser()
