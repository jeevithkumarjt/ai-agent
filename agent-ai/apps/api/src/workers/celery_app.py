from __future__ import annotations

from celery import Celery

from config import settings

celery_app = Celery(
    "agentai",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=[
        "workers.tasks_ingest",
        "workers.tasks_embed",
        "workers.tasks_cleanup",
        "workers.tasks_eval",
        "workers.tasks_monitor",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=4,
    task_time_limit=1800,
    task_soft_time_limit=1500,
    result_expires=86400,
    broker_connection_retry_on_startup=True,
    broker_connection_max_retries=20,
    task_default_queue="default",
    task_routes={
        "workers.tasks_ingest.crawl_page": {"queue": "crawl"},
        "workers.tasks_ingest.discover_and_enqueue": {"queue": "default"},
        "workers.tasks_embed.embed_and_index": {"queue": "index"},
        "workers.tasks_cleanup.cleanup_index": {"queue": "maintenance"},
        "workers.tasks_eval.run_eval": {"queue": "eval"},
        "workers.tasks_monitor.check_dlq": {"queue": "monitor"},
        "workers.tasks_ingest.webhook_refresh": {"queue": "priority"},
    },
    task_annotations={
        "workers.tasks_ingest.crawl_page": {"max_retries": settings.celery_max_retries},
        "workers.tasks_embed.embed_and_index": {"max_retries": settings.celery_max_retries},
    },
)
