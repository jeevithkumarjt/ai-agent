"""Billing and usage metering routes (ADR-021).

Endpoints:
- POST /v1/billing/customer  — ensure/create Stripe customer for tenant
- POST /v1/billing/subscribe  — subscribe tenant to a plan
- POST /v1/billing/usage      — record message usage for tenant
- GET  /v1/billing/usage      — get daily usage metrics for tenant
- GET  /v1/billing/limits     — check if tenant is within plan limits
"""
from __future__ import annotations

import uuid
from datetime import date
from typing import Annotated

from core.auth import get_current_tenant  # will be added later
from core.logging import get_logger
from core.settings import settings
from core.stripe_service import (
    check_limits,
    get_usage,
    record_message_usage,
    set_kb_size,
    set_seats,
)
from db.session import get_session
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from api.schemas import (
    BillingCustomerRequest,
    BillingSubscribeRequest,
    BillingUsageRequest,
    BillingLimitsCheck,
    BillingLimitsResponse,
)

logger = get_logger("api.billing")

router = APIRouter(prefix="/v1/billing", tags=["billing"])


@router.post("/customer", response_model=dict, status_code=status.HTTP_200_OK)
async def create_customer(
    body: BillingCustomerRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict[str, Any]:
    """Ensure a Stripe Customer exists for the tenant."""
    from core.stripe_service import ensure_customer

    # Resolve tenant_id from the session / auth context
    # For now, use the body tenant_id; in production this comes from JWT
    tenant_id = body.tenant_id

    customer_id = ensure_customer(tenant_id, email=body.email, name=body.name)
    return {"customer_id": customer_id, "tenant_id": tenant_id}


@router.post("/subscribe", response_model=dict, status_code=status.HTTP_200_OK)
async def subscribe_plan(
    body: BillingSubscribeRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict[str, Any]:
    """Subscribe a tenant to a Stripe price plan."""
    from core.stripe_service import ensure_customer

    tenant_id = body.tenant_id

    # Ensure customer exists
    ensure_customer(tenant_id, email=body.email, name=body.name)

    try:
        price_id = body.price_id  # e.g. "price_1Qxyz123abc456..."
        stripe_customer_id = _customer_key(tenant_id)

        # Create or update the subscription
        sub = stripe.Subscription.create(
            customer=stripe_customer_id,
            items=[{"price": price_id}],
            expand=["latest_invoice.payment_status"],
        )

        # Upsert usage metrics with initial values
        from core.stripe_service import upsert_usage
        upsert_usage(tenant_id, messages_sent=0, seats=body.seats or 1, kb_size_mb=body.kb_size_mb or 0.0)

        return {
            "subscription_id": sub.id,
            "customer_id": stripe_customer_id,
            "status": sub.status,
        }
    except stripe.StripeError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stripe error: {exc}",
        ) from exc


@router.post("/usage", response_model=dict, status_code=status.HTTP_200_OK)
async def record_usage(
    body: BillingUsageRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict[str, Any]:
    """Record message usage for a tenant (increment by 1 or specified amount)."""
    tenant_id = body.tenant_id
    amount = body.amount or 1

    record_message_usage(tenant_id)

    # Also update seats/KB size if provided
    if body.seats is not None:
        from core.stripe_service import set_seats
        set_seats(tenant_id, body.seats)
    if body.kb_size_mb is not None:
        from core.stripe_service import set_kb_size
        set_kb_size(tenant_id, body.kb_size_mb)

    return {"messages_recorded": amount, "tenant_id": tenant_id}


@router.get("/usage", response_model=dict, status_code=status.HTTP_200_OK)
async def get_usage_endpoint(
    tenant_id: str,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict[str, Any]:
    """Get daily usage metrics for a tenant."""
    usage = get_usage(tenant_id)
    return usage


@router.post("/limits", response_model=BillingLimitsResponse, status_code=status.HTTP_200_OK)
async def check_limits_endpoint(
    body: BillingLimitsCheck,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> BillingLimitsResponse:
    """Check if tenant is within their plan limits."""
    allowed, reason = check_limits(
        body.tenant_id,
        messages_count=body.messages_count or 1,
        add_seats=body.add_seats or 0,
        kb_add_mb=body.kb_add_mb or 0.0,
    )
    return BillingLimitsResponse(
        tenant_id=body.tenant_id,
        allowed=allowed,
        reason=reason,
    )