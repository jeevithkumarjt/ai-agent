from __future__ import annotations

from fastapi import APIRouter, Request

from domain.schemas.source import WebhookAck, WebhookContent
from infrastructure.security.webhook_signature import verify_webhook_signature

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/content", response_model=WebhookAck)
async def content_webhook(request: Request, data: WebhookContent) -> WebhookAck:
    """CMS content webhook. Signature verified, replay-protected, dispatches single-URL refresh."""
    raw_body = await request.body()
    verify_webhook_signature(raw_body, data.signature, data.timestamp)

    from db.redis import get_redis

    redis = get_redis()
    nonce = f"webhook:{data.url}:{data.timestamp}"
    if await redis.set(nonce, "1", ex=300, nx=True) is None:
        return WebhookAck(accepted=False)  # replay

    from workers.celery_app import celery_app

    result = celery_app.send_task(
        "workers.tasks_ingest.webhook_refresh",
        args=[data.url, data.event, "auto"],
        queue="priority",
    )
    return WebhookAck(accepted=True, job_id=result.id)
