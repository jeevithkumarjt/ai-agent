from __future__ import annotations

import json
from datetime import datetime, timezone

from db.redis import get_redis
from infrastructure.providers.llm.gateway import LLMGateway
from logging import get_logger

logger = get_logger("memory")

_SESSION_TTL = 86400  # 24h
_USER_TTL = 90 * 86400  # 90d
_CONVO_SUMMARY_TTL = 86400


class MemoryService:
    """Four memory layers: session, conversation (summarized), user, workspace.

    Priority is always below retrieved context. Summaries are compressed by a cheap model and
    injected with an explicit staleness caveat.
    """

    def __init__(self, gateway: LLMGateway | None = None) -> None:
        self.gateway = gateway

    # --- Session memory (recent turns, pronoun resolution) ---
    async def session_memory(self, tenant_id: str, session_id: str, *, max_turns: int = 6) -> list[dict]:
        redis = get_redis()
        raw = await redis.lrange(self._key("session", tenant_id, session_id), 0, max_turns - 1)
        turns: list[dict] = []
        for item in reversed(raw):
            try:
                turns.append(json.loads(item))
            except json.JSONDecodeError:
                continue
        return turns

    async def remember_turn(self, tenant_id: str, session_id: str, role: str, content: str) -> None:
        redis = get_redis()
        key = self._key("session", tenant_id, session_id)
        await redis.rpush(key, json.dumps({"role": role, "content": content[:4000]}))
        await redis.ltrim(key, -20, -1)
        await redis.expire(key, _SESSION_TTL)

    # --- Conversation memory (rolling summary) ---
    async def conversation_summary(self, tenant_id: str, session_id: str) -> str | None:
        redis = get_redis()
        return await redis.get(self._key("convo", tenant_id, session_id))

    async def update_conversation_summary(
        self, tenant_id: str, session_id: str, new_turns: list[dict]
    ) -> str | None:
        if not self.gateway or not new_turns:
            return None
        prev = await self.conversation_summary(tenant_id, session_id) or "No prior conversation."
        transcript = "\n".join(f"{t['role']}: {t['content'][:600]}" for t in new_turns)
        try:
            completion = await self.gateway.complete(
                [
                    {
                        "role": "system",
                        "content": (
                            "Summarize the conversation so far as compact bullet points. Keep facts "
                            "and user preferences. Output only the summary, under 300 words."
                        ),
                    },
                    {"role": "user", "content": f"Previous summary:\n{prev}\n\nNew turns:\n{transcript}"},
                ],
                role="fast",
                max_tokens=350,
            )
            summary = completion.text.strip()
            redis = get_redis()
            await redis.set(
                self._key("convo", tenant_id, session_id), summary, ex=_CONVO_SUMMARY_TTL
            )
            return summary
        except Exception as exc:
            logger.warning("summary_failed", error=str(exc))
            return None

    # --- User memory ---
    async def user_memory(self, tenant_id: str, user_id: str) -> dict:
        redis = get_redis()
        raw = await redis.get(self._key("user", tenant_id, user_id))
        if not raw:
            return {}
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {}

    async def remember_user_fact(self, tenant_id: str, user_id: str, key: str, value: str) -> None:
        memory = await self.user_memory(tenant_id, user_id)
        memory[key] = value
        redis = get_redis()
        await redis.set(self._key("user", tenant_id, user_id), json.dumps(memory), ex=_USER_TTL)

    # --- Workspace memory (admin-pinned facts) ---
    async def workspace_memory(self, tenant_id: str) -> list[dict]:
        redis = get_redis()
        raw = await redis.lrange(self._key("workspace", tenant_id, "_"), 0, -1)
        facts: list[dict] = []
        for item in raw:
            try:
                facts.append(json.loads(item))
            except json.JSONDecodeError:
                continue
        return facts

    async def pin_workspace_fact(self, tenant_id: str, fact: str) -> None:
        redis = get_redis()
        await redis.rpush(self._key("workspace", tenant_id, "_"), json.dumps({"fact": fact}))

    @staticmethod
    def _key(scope: str, tenant_id: str, ident: str) -> str:
        return f"agentai:{tenant_id}:memory:{scope}:{ident}"

    @staticmethod
    def freshness() -> str:
        return datetime.now(timezone.utc).isoformat()
