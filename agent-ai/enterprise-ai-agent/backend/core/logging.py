"""Structured JSON logging (ADR-006). Never use bare print()."""
from __future__ import annotations

import logging
import sys
from typing import Any

import structlog

_CONFIGURED = False


def _shared_processors() -> list[Any]:
    return [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer(ensure_ascii=False),
    ]


def setup_logging(level: str = "INFO", *, json: bool = True) -> None:
    """Install a JSON console handler and configure structlog. Idempotent."""
    global _CONFIGURED
    if _CONFIGURED:
        return
    _CONFIGURED = True

    root = logging.getLogger()
    root.setLevel(level.upper())
    if json:
        processors = _shared_processors()
    else:
        renderer = structlog.dev.ConsoleRenderer()
        processors = [p for p in _shared_processors() if not isinstance(p, structlog.processors.JSONRenderer)]
        processors.append(renderer)

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(level.upper()),
        logger_factory=structlog.PrintLoggerFactory(file=sys.stdout),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    """Return a bound structlog logger. setup_logging() is called lazily on first use."""
    setup_logging()
    return structlog.get_logger(name)
