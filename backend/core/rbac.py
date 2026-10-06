"""Role-based access control for the admin portal.

Role names map onto the existing ``users.role`` values:
  owner (Super Admin) | admin (Admin) | editor (Trainer) | viewer (Viewer)

Every admin route is guarded by one or more *scopes*. A role is granted a scope
either directly or via ``*`` (all).
"""
from __future__ import annotations

from functools import lru_cache

# Scopes (one per admin surface / capability)
SCOPE_ANALYTICS = "analytics.view"
SCOPE_CONVERSATIONS = "conversations.view"
SCOPE_KNOWLEDGE_VIEW = "knowledge.view"
SCOPE_KNOWLEDGE_WRITE = "knowledge.write"  # add/edit/delete knowledge + upload
SCOPE_KNOWLEDGE_TRAIN = "knowledge.train"  # trigger retrain / sync
SCOPE_UNANSWERED_VIEW = "unanswered.view"
SCOPE_UNANSWERED_WRITE = "unanswered.write"  # suggest/attach answers
SCOPE_UNANSWERED_APPROVE = "unanswered.approve"  # approve + retrain from answers
SCOPE_USERS_VIEW = "users.view"
SCOPE_USERS_MANAGE = "users.manage"
SCOPE_HEALTH = "health.view"
SCOPE_AUDIT = "audit.view"
SCOPE_NOTIFICATIONS = "notifications.view"
SCOPE_SETTINGS_VIEW = "settings.view"
SCOPE_SETTINGS_MANAGE = "settings.manage"  # includes api keys / prompts / models
SCOPE_BACKUP = "backup.manage"

_ALL = "*"

_ROLE_SCOPES: dict[str, set[str]] = {
    "owner": {
        _ALL,
    },
    "admin": {
        SCOPE_ANALYTICS,
        SCOPE_CONVERSATIONS,
        SCOPE_KNOWLEDGE_VIEW,
        SCOPE_KNOWLEDGE_WRITE,
        SCOPE_KNOWLEDGE_TRAIN,
        SCOPE_UNANSWERED_VIEW,
        SCOPE_UNANSWERED_WRITE,
        SCOPE_UNANSWERED_APPROVE,
        SCOPE_USERS_VIEW,
        SCOPE_HEALTH,
        SCOPE_AUDIT,
        SCOPE_NOTIFICATIONS,
        SCOPE_SETTINGS_VIEW,
    },
    "editor": {  # Trainer
        SCOPE_ANALYTICS,
        SCOPE_CONVERSATIONS,
        SCOPE_KNOWLEDGE_VIEW,
        SCOPE_KNOWLEDGE_WRITE,
        SCOPE_KNOWLEDGE_TRAIN,
        SCOPE_UNANSWERED_VIEW,
        SCOPE_UNANSWERED_WRITE,
        SCOPE_HEALTH,
        SCOPE_NOTIFICATIONS,
    },
    "viewer": {
        SCOPE_ANALYTICS,
        SCOPE_CONVERSATIONS,
        SCOPE_KNOWLEDGE_VIEW,
        SCOPE_UNANSWERED_VIEW,
        SCOPE_HEALTH,
        SCOPE_NOTIFICATIONS,
    },
}

_ROLE_LABELS = {
    "owner": "Super Admin",
    "admin": "Admin",
    "editor": "Trainer",
    "viewer": "Viewer",
}


@lru_cache(maxsize=64)
def role_scopes(role: str) -> frozenset[str]:
    scopes = _ROLE_SCOPES.get(role, set())
    if _ALL in scopes:
        all_scopes = {
            SCOPE_ANALYTICS, SCOPE_CONVERSATIONS, SCOPE_KNOWLEDGE_VIEW, SCOPE_KNOWLEDGE_WRITE,
            SCOPE_KNOWLEDGE_TRAIN, SCOPE_UNANSWERED_VIEW, SCOPE_UNANSWERED_WRITE,
            SCOPE_UNANSWERED_APPROVE, SCOPE_USERS_VIEW, SCOPE_USERS_MANAGE, SCOPE_HEALTH,
            SCOPE_AUDIT, SCOPE_NOTIFICATIONS, SCOPE_SETTINGS_VIEW, SCOPE_SETTINGS_MANAGE, SCOPE_BACKUP,
        }
        return frozenset(all_scopes)
    return frozenset(scopes)


def has_scope(role: str, scope: str) -> bool:
    return scope in role_scopes(role)


def role_label(role: str) -> str:
    return _ROLE_LABELS.get(role, role)
