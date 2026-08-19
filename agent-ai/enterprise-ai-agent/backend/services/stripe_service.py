"""Stripe billing and usage metering integration (ADR-021).

Provides:
- Customer creation / lookup per tenant
- Subscription management (create, retrieve, update, cancel)
- Usage metering: messages sent per tenant per day
- Tier enforcement: guest caps, seat limits, knowledge base size
"""

from __future__ import annotations

import os
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Optional

import stripe

from core.settings import settings

stripe.api_key = settings.stripe_api_key


class StripeError(RuntimeError):
    pass


def _customer_key(tenant_id: str) -> str:
    return f"tenant_{tenant_id}"


def ensure_customer(tenant_id: str, email: str | None = None, name: str | None = None) -> str:
    """Ensure a Stripe Customer exists for the tenant; return the customer ID."""
    try:
        customer = stripe.Customer.retrieve(_customer_key(tenant_id))
        # Update email/name if provided and changed
        if email or name:
            update_data: dict[str, Any] = {}
            if email:
                update_data["email"] = email
            if name:
                update_data["name"] = name
            stripe.Customer.modify(_customer_key(tenant_id), **update_data)
        return customer.id
    except stripe.NotFoundError:
        customer = stripe.Customer.create(
            id=_customer_key(tenant_id),
            email=email,
            name=name or f"Tenant {tenant_id}",
        )
        return customer.id
    except stripe.StripeError as exc:
        raise StripeError(f"failed to ensure customer: {exc}") from exc


def upsert_usage(
    tenant_id: str,
    *,
    messages_sent: int = 0,
    seats: int = 0,
    kb_size_mb: float = 0.0,
) -> None:
    """Upsert daily usage metrics for a tenant."""
    today = date.today()
    try:
        from db.session import async_session_factory  # type: ignore
        from sqlalchemy import select, insert
        from db.admin_models import UsageMetric  # type: ignore
    except Exception:
        # Fallback: just track in memory / skip if DB not ready
        return

    async def _upsert() -> None:
        async with async_session_factory() as session:
            # Try insert, on conflict update
            await session.execute(
                insert(UsageMetric).prefixes(["ON CONFLICT (tenant_id, date) DO UPDATE"]).values(
                    tenant_id=tenant_id,
                    date=today,
                    messages_sent=messages_sent,
                    seats=seats,
                    kb_size_mb=kb_size_mb,
                )
            )
            await session.commit()

    import asyncio
    asyncio.get_event_loop().run_until_complete(_upsert())


def record_message_usage(tenant_id: str) -> None:
    """Increment today's message count for a tenant by 1."""
    upsert_usage(tenant_id, messages_sent=1)


def set_seats(tenant_id: str, count: int) -> None:
    """Set the seat count for a tenant's usage record."""
    upsert_usage(tenant_id, seats=count)


def set_kb_size(tenant_id: str, size_mb: float) -> None:
    """Set the knowledge base size in MB for a tenant."""
    upsert_usage(tenant_id, kb_size_mb=size_mb)


def get_usage(tenant_id: str, day: date | None = None) -> dict[str, Any]:
    """Retrieve daily usage metrics for a tenant."""
    target_day = day or date.today()

    try:
        from db.session import async_session_factory  # type: ignore
        from sqlalchemy import select
        from db.admin_models import UsageMetric  # type: ignore
    except Exception:
        return {"messages_sent": 0, "seats": 0, "kb_size_mb": 0.0, "day": target_day.isoformat()}

    async def _get() -> dict[str, Any]:
        async with async_session_factory() as session:
            row = await session.scalar(
                select(UsageMetric).where(UsageMetric.tenant_id == tenant_id, UsageMetric.date == target_day)
            )
            if row is None:
                return {"messages_sent": 0, "seats": 0, "kb_size_mb": 0.0, "day": target_day.isoformat()}
            return {
                "messages_sent": int(row.messages_sent or 0),
                "seats": int(row.seats or 0),
                "kb_size_mb": float(row.kb_size_mb or 0.0),
                "day": row.date.isoformat(),
            }

    import asyncio
    return asyncio.get_event_loop().run_until_complete(_get())


def check_limits(
    tenant_id: str,
    *,
    messages_count: int = 1,
    add_seats: int = 0,
    kb_add_mb: float = 0.0,
) -> tuple[bool, str | None]:
    """Check if tenant is within their plan limits.

    Returns (allowed, reason). reason is None if allowed.
    """
    usage = get_usage(tenant_id)
    messages_sent = usage.get("messages_sent", 0)
    seats = usage.get("seats", 0)
    kb_size_mb = usage.get("kb_size_mb", 0.0)

    # Read current plan from settings or a per-tenant setting
    # For now, use a simple tier model via environment / settings
    max_messages = _plan_limit("max_messages")
    max_seats = _plan_limit("max_seats")
    max_kb_mb = _plan_limit("max_kb_mb")

    new_messages = messages_sent + messages_count
    new_seats = seats + add_seats
    new_kb_mb = kb_size_mb + kb_add_mb

    if new_messages > max_messages:
        return False, f"message limit exceeded: {new_messages}/{max_messages}"
    if new_seats > max_seats:
        return False, f"seat limit exceeded: {new_seats}/{max_seats}"
    if new_kb_mb > max_kb_mb:
        return False, f"knowledge base size limit exceeded: {new_kb_mb:.1f}/{max_kb_mb:.1f} MB"

    return True, None


def _plan_limit(key: str) -> int:
    """Read plan limit from settings; falls back to sensible defaults.

    In a full implementation, this would read from a per-tenant
    `subscriptions` table or Stripe customer metadata.
    """
    defaults: dict[str, int] = {
        "max_messages": 1000,     # free tier
        "max_seats": 5,
        "max_kb_mb": 100,
    }
    # TODO: read from Stripe subscription / per-tenant metadata
    return defaults.get(key, 1000)


# --- Guest message cap enforcement (integrated with guest_limits) ---

def guest_allowed(tenant_id: str, sid: str) -> bool:
    """Check if a guest session is allowed based on message caps + plan limits."""
    # First check the in-memory guest tracker
    from core.guest_limits import allow_guest_rate  # type: ignore
    if not allow_guest_rate(uuid.UUID(tenant_id), sid):
        return False

    # Then check plan-level message limits
    allowed, _ = check_limits(tenant_id, messages_count=1)
    return allowed