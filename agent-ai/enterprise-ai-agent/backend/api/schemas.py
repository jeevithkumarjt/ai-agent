"""Pydantic request/response schemas — mirror api/openapi.yaml exactly."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

Role = Literal["owner", "admin", "editor", "viewer"]


# --- Core schemas (auth, conversations, health) ---


class Health(BaseModel):
    status: str
    provider: str | None = None
    model: str | None = None
    embeddings: bool = False
    embeddings_model: str | None = None
    uptime_seconds: int = 0
    response_time_ms: int | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=1)


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class Conversation(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime


class MessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=8000)


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    conversation_id: uuid.UUID
    tenant_id: uuid.UUID
    role: Literal["user", "assistant", "tool"]
    content: str
    tool_calls: dict[str, Any] | list[Any] | None = None
    created_at: datetime


class MessagePage(BaseModel):
    items: list[MessageOut]
    total: int
    limit: int
    offset: int


# --- Billing schemas (ADR-021) ---


class BillingCustomerRequest(BaseModel):
    """Request to ensure/create a Stripe customer for a tenant."""
    tenant_id: str = Field(..., description="Tenant UUID as string")
    email: Optional[str] = Field(None, description="Customer email")
    name: Optional[str] = Field(None, description="Customer name")


class BillingSubscribeRequest(BaseModel):
    """Request to subscribe a tenant to a Stripe price plan."""
    tenant_id: str = Field(..., description="Tenant UUID as string")
    email: Optional[str] = Field(None, description="Customer email")
    name: Optional[str] = Field(None, description="Customer name")
    price_id: str = Field(..., description="Stripe price ID (e.g. price_1Qxyz123abc456...)")
    seats: Optional[int] = Field(default=1, ge=1, description="Number of seats")
    kb_size_mb: Optional[float] = Field(default=0.0, ge=0, description="Knowledge base size in MB")


class BillingUsageRequest(BaseModel):
    """Request to record usage for a tenant."""
    tenant_id: str = Field(..., description="Tenant UUID as string")
    amount: Optional[int] = Field(default=1, ge=1, description="Number of messages to record")
    seats: Optional[int] = Field(default=None, ge=1, description="Update seat count")
    kb_size_mb: Optional[float] = Field(default=None, ge=0, description="Update KB size in MB")


class BillingLimitsCheck(BaseModel):
    """Check if tenant is within plan limits."""
    tenant_id: str = Field(..., description="Tenant UUID as string")
    messages_count: Optional[int] = Field(default=1, ge=1, description="Number of messages to check")
    add_seats: Optional[int] = Field(default=0, ge=0, description="Additional seats to add")
    kb_add_mb: Optional[float] = Field(default=0.0, ge=0, description="Additional KB size in MB")


class BillingLimitsResponse(BaseModel):
    """Response for limit check."""
    tenant_id: str
    allowed: bool
    reason: Optional[str] = None


class BillingUsageResponse(BaseModel):
    """Response for usage endpoint."""
    messages_sent: int = Field(default=0, ge=0, description="Messages sent today")
    seats: int = Field(default=0, ge=0, description="Seat count")
    kb_size_mb: float = Field(default=0.0, ge=0, description="Knowledge base size in MB")
    day: str = Field(..., description="Date in YYYY-MM-DD format")


# --- WebSocket ticket (ADR-005) ---


class WsTicketRequest(BaseModel):
    """Request to issue a short-lived WebSocket ticket."""
    access_token: str = Field(..., description="Valid JWT access token")


# --- Tenant signup / management (ADR-024) ---


class TenantSignupRequest(BaseModel):
    """Request to create a new tenant (self-serve signup)."""
    owner_email: str = Field(..., description="Email of the first admin user")
    owner_password: str = Field(..., min_length=8, description="Password for the first admin user")
    tenant_name: str = Field(default="My Organization", description="Name for the new tenant")


class TenantSignupResponse(BaseModel):
    """Response from tenant signup."""
    tenant_id: str
    owner_email: str
    access_token: str
    refresh_token: str
    expires_in: int


class TenantListItem(BaseModel):
    """Summary of a tenant."""
    id: str
    name: str
    created_at: str
    user_count: int = 0
