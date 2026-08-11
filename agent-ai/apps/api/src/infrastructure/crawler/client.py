from __future__ import annotations

import asyncio
import hashlib
import random
from dataclasses import dataclass, field
from typing import Awaitable, Callable

import httpx

from config import settings
from domain.errors import UpstreamError
from logging import get_logger

from .circuit_breaker import HostCircuitBreaker
from .robots import RobotsTxt
from .url_utils import host_of

logger = get_logger("crawler.client")


@dataclass
class FetchResult:
    url: str
    final_url: str
    status: int
    headers: dict
    body: bytes
    content_type: str
    sha256: str

    @property
    def etag(self) -> str | None:
        return self.headers.get("etag")

    @property
    def last_modified(self) -> str | None:
        return self.headers.get("last-modified")


class CrawlClient:
    """Async HTTP client with robots compliance, circuit breaking, and exponential backoff."""

    def __init__(self) -> None:
        self._breaker = HostCircuitBreaker(threshold=3, cooldown=30.0)
        self._robots: dict[str, RobotsTxt] = {}
        self._robots_ok: set[str] = set()
        self._lock = asyncio.Lock()
        self._client = httpx.AsyncClient(
            headers={"User-Agent": settings.crawler_user_agent},
            timeout=httpx.Timeout(settings.crawler_request_timeout),
            follow_redirects=True,
            limits=httpx.Limits(max_connections=settings.crawler_concurrency, max_keepalive_connections=16),
        )

    async def close(self) -> None:
        await self._client.aclose()

    async def is_allowed(self, url: str) -> bool:
        if not settings.crawler_respect_robots:
            return True
        host = host_of(url)
        async with self._lock:
            if host in self._robots_ok:
                return self._robots[host].is_allowed(url)
        robots = await self._fetch_robots(host)
        async with self._lock:
            self._robots[host] = robots
            self._robots_ok.add(host)
        return robots.is_allowed(url)

    async def _fetch_robots(self, host: str) -> RobotsTxt:
        try:
            resp = await self._client.get(f"https://{host}/robots.txt")
            if resp.status_code == 200:
                return RobotsTxt(resp.text, settings.crawler_user_agent)
        except httpx.HTTPError:
            pass
        return RobotsTxt("", settings.crawler_user_agent)

    async def fetch(self, url: str, *, if_none_match: str | None = None, retries: int | None = None) -> FetchResult:
        max_retries = retries if retries is not None else settings.crawler_max_retries
        host = host_of(url)
        if self._breaker.is_open(host):
            raise UpstreamError(f"circuit open for {host}", detail={"host": host})
        for attempt in range(max_retries):
            try:
                result = await self._fetch_once(url, if_none_match=if_none_match)
                self._breaker.record_success(host)
                return result
            except (httpx.HTTPError, UpstreamError) as exc:
                self._breaker.record_failure(host)
                if isinstance(exc, httpx.HTTPStatusError) and exc.response.status_code == 404:
                    return self._not_found(url)
                if isinstance(exc, httpx.HTTPStatusError) and exc.response.status_code in {403, 410}:
                    return self._not_found(url)
                delay = settings.crawler_retry_base_delay * (2**attempt) + random.uniform(0, 1)
                if attempt < max_retries - 1:
                    logger.warning("crawl_retry", url=url, attempt=attempt, error=str(exc))
                    await asyncio.sleep(delay)
        raise UpstreamError(f"crawl failed for {url}", detail={"attempts": max_retries})

    async def _fetch_once(self, url: str, if_none_match: str | None = None) -> FetchResult:
        headers = {}
        if if_none_match:
            headers["If-None-Match"] = if_none_match
        resp = await self._client.get(url, headers=headers)
        resp.raise_for_status()
        body = resp.content
        if resp.status_code == 304:
            return FetchResult(
                url=url,
                final_url=str(resp.url),
                status=304,
                headers=dict(resp.headers),
                body=b"",
                content_type=resp.headers.get("content-type", ""),
                sha256=hashlib.sha256(b"").hexdigest(),
            )
        return FetchResult(
            url=url,
            final_url=str(resp.url),
            status=resp.status_code,
            headers=dict(resp.headers),
            body=body,
            content_type=resp.headers.get("content-type", ""),
            sha256=hashlib.sha256(body).hexdigest(),
        )

    def _not_found(self, url: str) -> FetchResult:
        return FetchResult(
            url=url,
            final_url=url,
            status=404,
            headers={},
            body=b"",
            content_type="",
            sha256=hashlib.sha256(b"").hexdigest(),
        )


async def with_semaphore(sem: asyncio.Semaphore, coro: Awaitable, fn: Callable, *args):
    async with sem:
        return await coro
