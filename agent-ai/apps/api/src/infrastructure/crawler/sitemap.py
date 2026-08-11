from __future__ import annotations

import gzip
import io
import xml.etree.ElementTree as ET
from dataclasses import dataclass

import httpx

from .url_utils import looks_like_sitemap, resolve_relative

XMLNS = "{http://www.sitemaps.org/schemas/sitemap/0.9}"


@dataclass
class SitemapEntry:
    url: str
    last_modified: str | None = None
    changefreq: str | None = None
    priority: str | None = None


async def fetch_text(client: httpx.AsyncClient, url: str) -> str:
    resp = await client.get(url)
    resp.raise_for_status()
    content_type = resp.headers.get("content-type", "")
    if url.endswith(".gz") or "gzip" in content_type:
        return gzip.decompress(resp.content).decode("utf-8", errors="replace")
    return resp.text


async def fetch_sitemap_index(client: httpx.AsyncClient, sitemap_url: str, depth: int = 0) -> list[SitemapEntry]:
    """Recursively discover all URLs from a sitemap index (nested sitemaps supported)."""
    if depth > 4:
        return []
    text = await fetch_text(client, sitemap_url)
    try:
        root = ET.fromstring(text)
    except ET.ParseError:
        return []

    entries: list[SitemapEntry] = []
    for loc in root.iter(f"{XMLNS}loc"):
        if looks_like_sitemap(loc.text or ""):
            entries.extend(_parse_urlset(client, loc.text, depth))
    if not entries:
        entries.extend(_parse_urlset(client, sitemap_url, depth))
    return entries


async def _parse_urlset(client: httpx.AsyncClient, urlset_url: str, depth: int) -> list[SitemapEntry]:
    """Parse a URL-set sitemap; if it's actually an index, recurse."""
    try:
        text = await fetch_text(client, urlset_url)
        root = ET.fromstring(text)
    except Exception:
        return []

    entries: list[SitemapEntry] = []
    for sitemap in root.findall(f"{XMLNS}sitemap"):
        loc = sitemap.findtext(f"{XMLNS}loc")
        if loc:
            entries.extend(fetch_sitemap_index(client, loc, depth + 1) if depth < 4 else [])
            continue
    for url_el in root.findall(f"{XMLNS}url"):
        loc = url_el.findtext(f"{XMLNS}loc")
        if not loc:
            continue
        entries.append(
            SitemapEntry(
                url=loc,
                last_modified=url_el.findtext(f"{XMLNS}lastmod"),
                changefreq=url_el.findtext(f"{XMLNS}changefreq"),
                priority=url_el.findtext(f"{XMLNS}priority"),
            )
        )
    return entries


def guess_sitemap_url(home_url: str) -> str:
    return resolve_relative(home_url, "sitemap_index.xml")
