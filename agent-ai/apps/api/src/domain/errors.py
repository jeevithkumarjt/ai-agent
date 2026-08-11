from __future__ import annotations

"""Domain errors — typed, mapped to RFC 7807 problem+json by the API error middleware.

Retryability is a first-class property so workers and circuit breakers know how to react.
"""

from enum import Enum


class ErrorCode(str, Enum):
    NOT_FOUND = "not_found"
    CONFLICT = "conflict"
    VALIDATION = "validation"
    UNAUTHORIZED = "unauthorized"
    FORBIDDEN = "forbidden"
    RATE_LIMITED = "rate_limited"
    UPSTREAM = "upstream_error"
    DEADLINE = "deadline_exceeded"
    UNPROCESSABLE = "unprocessable_entity"
    INTERNAL = "internal_error"
    DEPENDENCY_UNAVAILABLE = "dependency_unavailable"
    UNGROUNDED = "ungrounded_answer"


class AgentAIError(Exception):
    code: ErrorCode = ErrorCode.INTERNAL
    status_code: int = 500
    retryable: bool = False

    def __init__(self, message: str, *, detail: dict | None = None, cause: Exception | None = None):
        super().__init__(message)
        self.message = message
        self.detail = detail or {}
        self.cause = cause


class NotFoundError(AgentAIError):
    code = ErrorCode.NOT_FOUND
    status_code = 404


class ConflictError(AgentAIError):
    code = ErrorCode.CONFLICT
    status_code = 409


class ValidationError(AgentAIError):
    code = ErrorCode.VALIDATION
    status_code = 422


class UnauthorizedError(AgentAIError):
    code = ErrorCode.UNAUTHORIZED
    status_code = 401


class ForbiddenError(AgentAIError):
    code = ErrorCode.FORBIDDEN
    status_code = 403


class RateLimitedError(AgentAIError):
    code = ErrorCode.RATE_LIMITED
    status_code = 429

    def __init__(self, message: str, retry_after_seconds: int, **kwargs):
        super().__init__(message, **kwargs)
        self.retry_after_seconds = retry_after_seconds


class UpstreamError(AgentAIError):
    """Provider/upstream failure — safe to retry with backoff."""

    code = ErrorCode.UPSTREAM
    status_code = 502
    retryable = True


class DeadlineError(AgentAIError):
    code = ErrorCode.DEADLINE
    status_code = 504
    retryable = True


class DependencyUnavailableError(AgentAIError):
    """Vector DB, cache, or queue unavailable — caller should degrade gracefully."""

    code = ErrorCode.DEPENDENCY_UNAVAILABLE
    status_code = 503
    retryable = True


class UngroundedError(AgentAIError):
    """Confidence below threshold or validation failed — respond with the refusal path."""

    code = ErrorCode.UNGROUNDED
    status_code = 200


class PromptInjectionError(AgentAIError):
    code = ErrorCode.UNPROCESSABLE
    status_code = 422
