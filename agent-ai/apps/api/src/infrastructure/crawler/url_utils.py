from __future__ import annotations

from urllib.parse import parse_qsl, urlencode, urldefrag, urljoin, urlparse, urlunparse


def normalize_url(url: str, *, strip_query: bool = False) -> str:
    """Canonicalize a URL for deduplication: scheme+host lowercased, defragmented."""
    url = urldefrag(url)[0]
    parsed = urlparse(url)
    scheme = parsed.scheme.lower() or "https"
    host = parsed.netloc.lower()
    path = parsed.path or "/"
    query = "" if strip_query else parsed.query
    return urlunparse((scheme, host, path, "", query, ""))


def same_site(url: str, base: str) -> bool:
    return urlparse(url).netloc == urlparse(base).netloc


def is_allowed_scheme(url: str) -> bool:
    return urlparse(url).scheme.lower() in {"http", "https"}


def resolve_relative(base_url: str, href: str) -> str:
    return urljoin(base_url, href)


def host_of(url: str) -> str:
    return urlparse(url).netloc


def looks_like_sitemap(url: str) -> bool:
    path = urlparse(url).path.lower()
    return path.endswith(".xml") or path.endswith(".xml.gz") or "sitemap" in path


def strip_trailing_slash(url: str) -> str:
    parsed = urlparse(url)
    path = parsed.path
    if path != "/" and path.endswith("/"):
        path = path.rstrip("/")
    return urlunparse((parsed.scheme, parsed.netloc, path, parsed.params, parsed.query, ""))
