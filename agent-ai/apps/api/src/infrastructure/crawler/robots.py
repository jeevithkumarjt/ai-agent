from __future__ import annotations

from dataclasses import dataclass, field
from urllib.parse import urlparse


@dataclass
class RobotsRules:
    disallow: list[str] = field(default_factory=list)
    allow: list[str] = field(default_factory=list)
    crawl_delay: float | None = None

    def is_allowed(self, url: str) -> bool:
        path = urlparse(url).path or "/"
        best: str | None = None
        for pattern in self.disallow:
            if path.startswith(pattern) and (best is None or len(pattern) > len(best)):
                best = pattern
        for pattern in self.allow:
            if path.startswith(pattern) and (len(pattern) > (len(best) if best else 0)):
                return True
        return best is None


class RobotsTxt:
    """Minimal robots.txt parser: longest-match wins, user-agent scoped."""

    def __init__(self, content: str, user_agent: str):
        self.rules = self._parse(content, user_agent)

    def _parse(self, content: str, user_agent: str) -> RobotsRules:
        rules = RobotsRules()
        current_group = None
        wanted_agent = user_agent.split("/")[0].lower()
        for raw_line in content.splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or ":" not in line:
                continue
            key, _, value = line.partition(":")
            key = key.strip().lower()
            value = value.strip()
            if key == "user-agent":
                current_group = value.lower()
            elif current_group is None:
                continue
            elif current_group == "*" or wanted_agent in current_group:
                if key == "disallow":
                    rules.disallow.append(value)
                elif key == "allow":
                    rules.allow.append(value)
                elif key == "crawl-delay":
                    try:
                        rules.crawl_delay = float(value)
                    except ValueError:
                        pass
        return rules

    def is_allowed(self, url: str) -> bool:
        return self.rules.is_allowed(url)

    @property
    def crawl_delay(self) -> float | None:
        return self.rules.crawl_delay
