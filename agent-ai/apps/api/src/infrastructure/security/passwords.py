from __future__ import annotations

import secrets

from pwdlib import PasswordHash

_ph = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return _ph.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _ph.verify(password, password_hash)
    except ValueError:
        return False


def generate_api_key() -> str:
    return f"ak_{secrets.token_urlsafe(32)}"


def hash_api_key(key: str) -> str:
    import hashlib

    return hashlib.sha256(key.encode()).hexdigest()
