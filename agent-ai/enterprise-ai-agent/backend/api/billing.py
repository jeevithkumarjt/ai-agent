"""Billing and usage metering routes (ADR-021).

Endpoints:
- POST /v1/billing/customer  — ensure/create Stripe customer for tenant
- POST /v1/billing/subscribe  — subscribe tenant to a plan
- POST /v1/billing/usage      — record message usage for tenant
- GET  /v1/billing/usage      — get daily usage metrics for tenant
- GET  /v1/billing/limits     — check if tenant is within plan limits

NOTE: Stripe billing is not wired up yet. All endpoints return 501 Not Implemented.
"""
from __future__ import annotations

from core.logging import get_logger
from db.session import get_session
from fastapi import APIRouter, Depends, status
from typing import Annotated
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


@router.post("/customer", response_model=dict, status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def create_customer(
    body: BillingCustomerRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    return {"detail": "Stripe billing not configured"}


@router.post("/subscribe", response_model=dict, status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def subscribe_plan(
    body: BillingSubscribeRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    return {"detail": "Stripe billing not configured"}


@router.post("/usage", response_model=dict, status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def record_usage(
    body: BillingUsageRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    return {"detail": "Stripe billing not configured"}


@router.get("/usage", response_model=dict, status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def get_usage_endpoint(
    tenant_id: str,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    return {"detail": "Stripe billing not configured"}


@router.post("/limits", response_model=BillingLimitsResponse, status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def check_limits_endpoint(
    body: BillingLimitsCheck,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> BillingLimitsResponse:
    return BillingLimitsResponse(
        tenant_id=body.tenant_id,
        allowed=True,
        reason="Stripe billing not configured — all requests allowed",
    )
