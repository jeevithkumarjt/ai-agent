from __future__ import annotations

from logging import get_logger
from telemetry import gauge

from .celery_app import celery_app
from .runtime import run_async

logger = get_logger("tasks.monitor")

dlq_depth = gauge("agentai_dlq_depth", "Dead-letter queue depth")


async def _check_dlq() -> dict:
    """Durable-queue monitor: report dead-letter depth for alerting."""
    try:
        import redis as _redis

        from config import settings

        client = _redis.from_url(settings.celery_broker_url)
        info = client.info("stream")
        depth = 0
        for key, value in info.items():
            if str(key).startswith("stream_") and isinstance(value, int):
                depth += value
        dlq_depth.set_to(depth)
        return {"depth": depth}
    except Exception:
        dlq_depth.set_to(-1)
        return {"depth": -1}


@celery_app.task(name="workers.tasks_monitor.check_dlq")
def check_dlq() -> dict:
    return run_async(_check_dlq)
