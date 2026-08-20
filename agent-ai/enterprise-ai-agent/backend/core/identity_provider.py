"""Identity provider abstraction (ADR-022).

Supports multiple identity provider types:
- ``provider``: "jwt"  (existing stateless JWT with tenant_id claim)
- ``provider``: "saml"  (SAML 2.0 web profile / IdP-initiated)
- ``provider``: "oidc"  (OIDC / OpenID Connect flow)

The abstraction decouples the auth layer from any specific IdP, so adding
SAML/OIDC later does not require rewriting ``core/auth.py``, ``core/rbac.py``,
or the API routes.

Each provider implements:
- ``login_url(redirect_uri)`` — URL the user should be redirected to
- ``callback(request)`` — exchange code/token, return user dict {id, email, role, tenant_id}
- ``logout_url(redirect_uri)`` — URL to redirect to for logout
"""

from __future__ import annotations

import abc
import base64
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any, Dict, Literal, Optional, Tuple

TokenType = Literal["access", "refresh"]

import urllib.parse


class IdentityProvider(abc.ABC):
    """Base interface for all identity providers."""

    name: str
    provider_type: str  # "jwt" | "saml" | "oidc"

    @abc.abstractmethod
    def login_url(self, redirect_uri: str) -> str:
        """URL the user should be redirected to for authentication."""

    @abc.abstractmethod
    async def callback(
        self, request: Any, **kwargs: Any,
    ) -> Tuple[Optional[dict], Optional[str]]:
        """Exchange code/token for user info.

        Returns
        -------
        (user_info, error)
            *user_info* — dict with keys ``sub``, ``email``, ``role``, ``tenant_id``
              or ``None`` if authentication failed.
            *error* — human-readable error string or ``None``.
        """

    @abc.abstractmethod
    def logout_url(self, redirect_uri: str) -> str:
        """URL to redirect to for logout."""


# ---------------------------------------------------------------------------
# JWT / "password" provider (existing behaviour, now conforming to the interface)
# ---------------------------------------------------------------------------


class JwtIdentityProvider(IdentityProvider):
    """JWT-based identity provider (the current stateless token model)."""

    name = "jwt"
    provider_type = "jwt"

    def login_url(self, redirect_uri: str) -> str:
        # JWT auth is implicit via login; no external redirect needed.
        # We return the API login endpoint so the frontend can POST.
        return redirect_uri

    async def callback(
        self, request: Any, **kwargs: Any,
    ) -> Tuple[Optional[dict], Optional[str]]:
        # For JWT, the "callback" is the login endpoint itself which validates
        # email/password and issues a token pair. The frontend handles the token
        # storage. We return None to signal "handled elsewhere".
        return None, None

    def logout_url(self, redirect_uri: str) -> str:
        # Stateless JWT: there's no session to close server-side.
        # Emit a no-op or a front-end clear-tokens call.
        return redirect_uri


# ---------------------------------------------------------------------------
# SAML provider skeleton (to be filled in when a specific IdP is chosen)
# ---------------------------------------------------------------------------


class SamlIdentityProvider(IdentityProvider):
    """SAML 2.0 identity provider.

    Requires IdP metadata URL or XML. The actual SAML library (e.g. python3-saml)
    handles the protocol details; this class wires the FastAPI routes.
    """

    name = "saml"
    provider_type = "saml"

    def __init__(self, *, entity_id: str, metadata_url: str, **kwargs: Any) -> None:
        self.entity_id = entity_id
        self.metadata_url = metadata_url
        # python3-saml config would be initialized here

    def login_url(self, redirect_uri: str) -> str:
        # SAML IdP-initiated login: redirect to the IdP's SSO URL
        # The actual URL is derived from the IdP metadata + entity_id
        return f"https://idp.example.com/sso?entity_id={self.entity_id}&redirect_uri={urllib.parse.quote(redirect_uri, safe='')}"

    async def callback(self, request: Any, **kwargs: Any) -> Tuple[Optional[dict], Optional[str]]:
        """Parse SAMLResponse from the IdP and extract user attributes.

        Returns (user_info_dict, error_string).
        The user_info dict should contain: sub, email, role, tenant_id.
        """
        # TODO: integrate python3-saml or similar to parse the SAML response
        return None, "SAML callback not yet configured — contact admin"

    def logout_url(self, redirect_uri: str) -> str:
        return f"https://idp.example.com/logout?redirect_uri={urllib.parse.quote(redirect_uri, safe='')}"


# ---------------------------------------------------------------------------
# OIDC provider skeleton (to be filled in when a specific IdP is chosen)
# ---------------------------------------------------------------------------


class OidcIdentityProvider(IdentityProvider):
    """OpenID Connect (OIDC) provider.

    Supports Authorization Code Flow with PKCE. The actual library (e.g.
    authlib, oidc-client) handles token exchange; this class wires the routes.
    """

    name = "oidc"
    provider_type = "oidc"

    def __init__(self, *, issuer: str, client_id: str, client_secret: str, **kwargs: Any) -> None:
        self.issuer = issuer
        self.client_id = client_id
        self.client_secret = client_secret
        # authlib or similar would be initialized here

    def login_url(self, redirect_uri: str) -> str:
        # OIDC Authorization Code Flow start
        # Redirect to the IdP's authorize endpoint
        authorize_url = f"{self.issuer}/authorize"
        state = str(uuid.uuid4())
        code_challenge = self._generate_pkce_challenge()
        # Store state for callback verification (in session or cache)
        return f"{authorize_url}?response_type=code&client_id={self.client_id}&redirect_uri={urllib.parse.quote(redirect_uri, safe='')}&state={state}&code_challenge={code_challenge}"

    @staticmethod
    def _generate_pkce_challenge() -> str:
        import secrets
        code_verifier = secrets.token_urlspace(32)  # noqa: RUF006  (PKCE verifier)
        # SHA256 hash + base64url encode for code_challenge
        import hashlib
        challenge = base64.urlsafe_b64encode(
            hashlib.sha256(code_verifier.encode()).digest()
        ).rstrip(b"=").decode()
        return challenge

    async def callback(self, request: Any, **kwargs: Any) -> Tuple[Optional[dict], Optional[str]]:
        """Exchange authorization code for ID token + userinfo.

        Returns (user_info_dict, error_string).
        user_info dict keys: sub, email, role, tenant_id
        """
        # TODO: integrate authlib or similar to exchange code, verify JWT,
        # fetch userinfo, and map to our user model.
        code = kwargs.get("code")
        if not code:
            return None, "Missing authorization code"
        # Placeholder: return generic user until real OIDC client is wired
        return {
            "sub": str(uuid.uuid4()),
            "email": "user@company.com",
            "role": "viewer",
            "tenant_id": "default-tenant",
        }, None

    def logout_url(self, redirect_uri: str) -> str:
        # OIDC End Session Request (ESR) — typically POST to IdP's end_session_endpoint
        return f"{self.issuer}/logout?redirect_uri={urllib.parse.quote(redirect_uri, safe='')}"


# ---------------------------------------------------------------------------
# Provider registry / factory
# ---------------------------------------------------------------------------


def get_provider(name: str, **config: Any) -> IdentityProvider:
    """Factory to retrieve an IdentityProvider by name.

    Supported names: "jwt", "saml", "oidc"
    Config parameters depend on the specific provider.
    """
    providers: Dict[str, type[IdentityProvider]] = {
        "jwt": JwtIdentityProvider,
        "saml": SamlIdentityProvider,
        "oidc": OidcIdentityProvider,
    }

    provider_class = providers.get(name)
    if provider_class is None:
        raise ValueError(f"Unknown identity provider: {name}")

    return provider_class(**config)