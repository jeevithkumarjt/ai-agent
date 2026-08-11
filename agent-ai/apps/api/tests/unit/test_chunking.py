from __future__ import annotations

import hashlib

from infrastructure.chunking import chunk_document
from infrastructure.parsers.base import ParsedDocument, ParsedSection


def _parsed(blocks: list[tuple[str, str, str]]) -> ParsedDocument:
    return ParsedDocument(
        title="test",
        lang="en",
        content_type="text/html",
        sections=[ParsedSection(heading_path=p, heading=h, text=t) for p, h, t in blocks],
    )


def test_heading_chunker_respects_sections() -> None:
    doc = _parsed(
        [
            ("/features", "Features", "Tryvium provides AI voice agents, chat agents, and analytics."),
            ("/pricing", "Pricing", "Pricing starts at $49 per month."),
        ]
    )
    chunks = chunk_document(doc)
    assert len(chunks) == 2
    assert chunks[0].section_path == "/features"
    assert chunks[1].section_path == "/pricing"


def test_long_section_is_windowed() -> None:
    long_text = " ".join(["sentence number %d about tryvium products and services" % i for i in range(80)])
    doc = _parsed([("/", None, long_text)])
    chunks = chunk_document(doc)
    assert len(chunks) > 1
    for chunk in chunks:
        assert len(chunk.text) <= 1600
        assert chunk.text.strip()


def test_chunk_sha256_stable() -> None:
    doc = _parsed([("/", None, "stable content across runs")])
    a = chunk_document(doc)[0]
    b = chunk_document(doc)[0]
    assert a.sha256 == b.sha256 == hashlib.sha256("stable content across runs".encode()).hexdigest()


def test_no_duplicate_empty_chunks() -> None:
    doc = _parsed([("/", None, "")])
    assert chunk_document(doc) == []
