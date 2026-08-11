"""Admin portal service — document/knowledge lifecycle, settings, analytics
ingestion, audit + notifications, train jobs, API keys, and backup/restore.

Constructed once in main.py and stored on ``app.state.portal``. All public
methods are tenant-scoped (ADR-004). Heavy work (embeddings, refresh, zip
processing) runs in background train jobs so API calls stay fast.
"""
from __future__ import annotations

import asyncio
import csv
import hashlib
import io
import json
import re as _re
import secrets
import time
import zipfile
from contextlib import suppress
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any

from core.logging import get_logger
from core.settings import settings
from db.admin_models import (
    AdminDocument,
    AdminDocumentVersion,
    AdminSetting,
    AnswerMetric,
    AuditLog,
    MessageFeedback,
    Notification,
    TrainJob,
    UnansweredQuestion,
)
from db.models import DocumentChunk, Message
from db.session import async_session_factory
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from services.knowledge import KnowledgeStore, _extract_text
from services.rag import RagService

logger = get_logger("services.portal")

SUPPORTED_EXTENSIONS = {
    ".txt", ".md", ".markdown", ".rst", ".text", ".log",
    ".csv", ".json", ".html", ".htm", ".xml",
    ".pdf", ".docx", ".xlsx", ".pptx",
}
MAX_UPLOAD_BYTES = 25 * 1024 * 1024
MAX_ZIP_FILES = 200

UNANSWERED_PHRASES = (
    "i could not", "i don't have", "i do not have", "not available", "not covered",
    "no information", "no knowledge", "not mentioned", "unable to answer", "can't answer",
    "cannot answer", "do not know", "i don't know", "does not have information",
    "no data available", "not found in", "not in the knowledge", "no relevant",
)

DEFAULT_SETTINGS: dict[str, Any] = {
    "retrieval_top_k": settings.retrieval_top_k,
    "system_prompt_override": "",
    "knowledge_sites": list(settings.knowledge_sites),
    "knowledge_max_site_pages": settings.knowledge_max_site_pages,
    "auto_sync_minutes": 0,
    "agent_model": settings.anthropic_model,
    "embedding_model": settings.embeddings_model,
    "disabled_users": [],
    "api_keys": [],
}


def _normalize(text: str) -> str:
    return " ".join(text.lower().split()).strip()


class PortalService:
    def __init__(self, rag: RagService, knowledge: KnowledgeStore) -> None:
        self.rag = rag
        self.knowledge = knowledge
        self.docs_dir = Path(settings.knowledge_docs_dir)
        self._settings_cache: dict[str, dict[str, Any]] = {}
        self._jobs: dict[str, asyncio.Task] = {}

    # =========================================================================
    # Settings
    # =========================================================================

    async def load_settings(self, session: AsyncSession, tenant_id: Any) -> dict[str, Any]:
        key = str(tenant_id)
        if key not in self._settings_cache:
            rows = (await session.scalars(select(AdminSetting).where(AdminSetting.tenant_id == tenant_id))).all()
            merged = dict(DEFAULT_SETTINGS)
            for row in rows:
                merged[row.key] = row.value
            self._settings_cache[key] = merged
        return dict(self._settings_cache[key])

    def get_setting(self, tenant_id: Any, key: str, default: Any = None) -> Any:
        value = self._settings_cache.get(str(tenant_id), {}).get(key, default)
        return value

    async def set_settings(self, session: AsyncSession, tenant_id: Any, updates: dict[str, Any], by: Any = None) -> dict[str, Any]:
        await self.load_settings(session, tenant_id)
        for key, value in updates.items():
            if key not in DEFAULT_SETTINGS:
                continue
            row = await session.scalar(select(AdminSetting).where(AdminSetting.tenant_id == tenant_id, AdminSetting.key == key))
            if row is None:
                row = AdminSetting(tenant_id=tenant_id, key=key, value=value, updated_by=by)
                session.add(row)
            else:
                row.value = value
                row.updated_by = by
        await session.commit()
        self._settings_cache.pop(str(tenant_id), None)
        await self.load_settings(session, tenant_id)
        return dict(self._settings_cache[str(tenant_id)])

    # =========================================================================
    # Documents
    # =========================================================================

    async def prepare_uploads(
        self,
        session: AsyncSession,
        tenant_id: Any,
        files: list[Any],
        by: Any,
    ) -> dict[str, Any]:
        """Validate/sanitize uploads and persist files + draft rows. Returns a
        job id whose background task performs extraction/indexing."""
        entries: list[dict[str, Any]] = []  # {path, name, rel, bytes}
        errors: list[str] = []

        def add_raw(name: str, data: bytes) -> None:
            if len(data) > MAX_UPLOAD_BYTES:
                errors.append(f"{name}: exceeds {MAX_UPLOAD_BYTES // (1024 * 1024)}MB limit")
                return
            ext = Path(name).suffix.lower()
            if ext not in SUPPORTED_EXTENSIONS:
                errors.append(f"{name}: unsupported type {ext or '(none)'}")
                return
            entries.append({"name": name, "ext": ext, "data": data})

        for upload in files:
            name = Path(upload.filename or "upload").name.replace("\\", "/")
            data = await upload.read()
            if name.lower().endswith(".zip"):
                try:
                    with zipfile.ZipFile(io.BytesIO(data)) as zf:
                        for info in zf.infolist():
                            if info.is_dir() or len(zf.namelist()) > MAX_ZIP_FILES:
                                continue
                            add_raw(info.filename, zf.read(info))
                except zipfile.BadZipFile:
                    errors.append(f"{name}: not a valid zip archive")
            else:
                add_raw(name, data)

        # dedupe by path within this batch
        seen: set[str] = set()
        unique: list[dict[str, Any]] = []
        for entry in entries:
            rel = self._safe_rel(entry["name"])
            if rel in seen:
                continue
            seen.add(rel)
            entry["rel"] = rel
            unique.append(entry)

        if not unique:
            return {"job_id": None, "created": 0, "duplicates": 0, "errors": errors}

        job = TrainJob(tenant_id=tenant_id, kind="upload", status="running", progress=0, started_by=by)
        session.add(job)
        await session.commit()
        await session.refresh(job)

        for entry in unique:
            checksum = hashlib.sha256(entry["data"]).hexdigest()
            existing = await session.scalar(
                select(AdminDocument).where(AdminDocument.tenant_id == tenant_id, AdminDocument.path == entry["rel"])
            )
            if existing is not None and existing.status == "indexed" and existing.checksum == checksum:
                entry["duplicate"] = True
                continue
            path = self.docs_dir / entry["rel"]
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(entry["data"])
            doc = AdminDocument(
                tenant_id=tenant_id,
                name=entry["name"],
                path=entry["rel"],
                kind="file",
                ext=entry["ext"],
                size_bytes=len(entry["data"]),
                checksum=checksum,
                status="draft",
                created_by=by,
            )
            session.add(doc)
        await session.commit()

        dupes = sum(1 for e in unique if e.get("duplicate"))
        created = len(unique) - dupes
        task = asyncio.create_task(self._ingest_batch_job(job_id=str(job.id), tenant_id=tenant_id, created_by=by))
        self._jobs[str(job.id)] = task
        await self.audit(
            session, tenant_id, by, "knowledge.upload", "knowledge",
            str(job.id), detail={"files": len(unique), "duplicates": dupes, "errors": errors},
        )
        return {"job_id": str(job.id), "created": created, "duplicates": dupes, "errors": errors}

    async def _ingest_batch_job(self, *, job_id: str, tenant_id: Any, created_by: Any) -> None:
        async with async_session_factory() as session:
            try:
                docs = (await session.scalars(
                    select(AdminDocument)
                    .where(AdminDocument.tenant_id == tenant_id, AdminDocument.status == "draft")
                    .order_by(AdminDocument.created_at)
                )).all()
                total = len(docs) or 1
                for index, doc in enumerate(docs, start=1):
                    await self._ingest_one(session, tenant_id, str(doc.id), reason="upload", by=created_by)
                    await self._update_job(
                        session, job_id, tenant_id,
                        progress=int(index / total * 100),
                        message=f"Indexed {index} of {total} documents",
                    )
                await self._finish_job(session, job_id, tenant_id, "done", 100, "Upload complete")
                await self.notify(session, tenant_id, "success", "Knowledge upload complete",
                                  f"{total} document(s) indexed and searchable.")
            except Exception as exc:
                logger.exception("upload_job_failed", job_id=job_id)
                await self._finish_job(session, job_id, tenant_id, "error", 100, f"Upload failed: {exc}")
                await self.notify(session, tenant_id, "error", "Knowledge upload failed", str(exc))

    async def _ingest_one(self, session: AsyncSession, tenant_id: Any, doc_id: str, *, reason: str, by: Any) -> dict[str, Any]:
        doc = await session.get(AdminDocument, doc_id)
        if doc is None or doc.tenant_id != tenant_id:
            return {"ok": False, "error": "not found"}
        path = self.docs_dir / doc.path
        text = ""
        try:
            text = _extract_text(path) or ""
        except Exception:
            text = ""
        if doc.kind == "manual" and not text:
            text = doc.content_text
        if not text.strip():
            doc.status = "error"
            doc.error = "No extractable text (missing parser or empty file)."
            await session.commit()
            return {"ok": False, "error": doc.error}

        source_id = f"documents/{doc.path}"
        await session.execute(delete(DocumentChunk).where(DocumentChunk.tenant_id == tenant_id, DocumentChunk.source_id == source_id))
        await self.rag.ingest_text(
            session, tenant_id=tenant_id, source_id=source_id, text=text,
            metadata={"doc_id": str(doc.id), "name": doc.name, "kind": doc.kind, "title": doc.title},
        )
        doc.content_text = text
        doc.status = "indexed"
        doc.error = ""
        if reason == "upload":
            doc.version = 1
        else:
            doc.version = (doc.version or 0) + 1
        doc.last_indexed_at = func.now()
        session.add(
            AdminDocumentVersion(
                tenant_id=tenant_id, document_id=doc.id, version=doc.version,
                checksum=doc.checksum, content_text=text, reason=reason, created_by=by,
            )
        )
        await session.commit()
        await asyncio.to_thread(self.knowledge.refresh_documents_only)
        return {"ok": True, "chunks": 0}

    async def list_documents(self, session: AsyncSession, tenant_id: Any, *, q: str = "", status: str = "", limit: int = 200, offset: int = 0) -> dict[str, Any]:
        stmt = select(AdminDocument).where(AdminDocument.tenant_id == tenant_id)
        if status:
            stmt = stmt.where(AdminDocument.status == status)
        if q:
            like = f"%{q}%"
            stmt = stmt.where(AdminDocument.name.ilike(like) | AdminDocument.title.ilike(like) | AdminDocument.path.ilike(like))
        total = await session.scalar(select(func.count()).select_from(AdminDocument).where(AdminDocument.tenant_id == tenant_id))
        rows = (await session.scalars(stmt.order_by(AdminDocument.updated_at.desc()).limit(limit).offset(offset))).all()
        return {"items": [self._doc_payload(d) for d in rows], "total": total or 0, "limit": limit, "offset": offset}

    async def get_document(self, session: AsyncSession, tenant_id: Any, doc_id: str) -> AdminDocument:
        doc = await session.get(AdminDocument, doc_id)
        if doc is None or doc.tenant_id != tenant_id:
            raise ValueError("document not found")
        return doc

    async def document_versions(self, session: AsyncSession, tenant_id: Any, doc_id: str) -> list[dict[str, Any]]:
        rows = (await session.scalars(
            select(AdminDocumentVersion)
            .where(AdminDocumentVersion.tenant_id == tenant_id, AdminDocumentVersion.document_id == doc_id)
            .order_by(AdminDocumentVersion.version.desc())
        )).all()
        return [{"version": v.version, "reason": v.reason, "checksum": v.checksum, "created_at": str(v.created_at), "content_text": v.content_text} for v in rows]

    async def edit_document(self, session: AsyncSession, tenant_id: Any, doc_id: str, *, content: str, title: str = "", reason: str = "", by: Any = None) -> dict[str, Any]:
        doc = await self.get_document(session, tenant_id, doc_id)
        prev_content = doc.content_text
        doc.content_text = content
        doc.title = title or doc.title
        doc.checksum = hashlib.sha256(content.encode("utf-8")).hexdigest()
        doc.status = "draft"
        await session.commit()
        await self._ingest_one(session, tenant_id, doc_id, reason=reason or "edit", by=by)
        await self.audit(session, tenant_id, by, "knowledge.edit", "knowledge", doc_id,
                         detail={"name": doc.name, "reason": reason, "prev_len": len(prev_content), "new_len": len(content)})
        await self.notify(session, tenant_id, "info", "Knowledge edited", f"\"{doc.name}\" was updated and re-indexed.")
        return {"ok": True}

    async def delete_document(self, session: AsyncSession, tenant_id: Any, doc_id: str, by: Any = None) -> dict[str, Any]:
        doc = await self.get_document(session, tenant_id, doc_id)
        source_id = f"documents/{doc.path}"
        await session.execute(delete(DocumentChunk).where(DocumentChunk.tenant_id == tenant_id, DocumentChunk.source_id == source_id))
        name = doc.name
        await session.delete(doc)
        await session.commit()
        path = self.docs_dir / doc.path
        try:
            if path.is_file():
                path.unlink()
        except OSError:
            pass
        await asyncio.to_thread(self.knowledge.refresh_documents_only)
        await self.audit(session, tenant_id, by, "knowledge.delete", "knowledge", doc_id, detail={"name": name})
        await self.notify(session, tenant_id, "warning", "Knowledge removed", f"\"{name}\" was deleted.")
        return {"ok": True}

    async def rollback_document(self, session: AsyncSession, tenant_id: Any, doc_id: str, version: int, by: Any = None) -> dict[str, Any]:
        doc = await self.get_document(session, tenant_id, doc_id)
        version_row = await session.scalar(
            select(AdminDocumentVersion).where(
                AdminDocumentVersion.tenant_id == tenant_id,
                AdminDocumentVersion.document_id == doc_id,
                AdminDocumentVersion.version == version,
            )
        )
        if version_row is None:
            raise ValueError(f"version {version} not found")
        doc.content_text = version_row.content_text
        doc.checksum = version_row.checksum
        doc.status = "draft"
        await session.commit()
        await self._ingest_one(session, tenant_id, doc_id, reason=f"rollback to v{version}", by=by)
        await self.audit(session, tenant_id, by, "knowledge.rollback", "knowledge", doc_id,
                         detail={"name": doc.name, "to_version": version})
        await self.notify(session, tenant_id, "info", "Knowledge rolled back", f"\"{doc.name}\" restored to version {version}.")
        return {"ok": True}

    async def add_manual_document(self, session: AsyncSession, tenant_id: Any, *, title: str, content: str, by: Any = None, kind: str = "manual") -> dict[str, Any]:
        safe = re_slug(title) or "manual-doc"
        rel = f"manual/{safe}.md"
        path = self.docs_dir / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        body = f"# {title}\n\n{content}".strip()
        path.write_text(body, encoding="utf-8")
        doc = AdminDocument(
            tenant_id=tenant_id, name=f"{title}.md", path=rel, kind=kind, ext=".md",
            size_bytes=len(body.encode("utf-8")),
            checksum=hashlib.sha256(body.encode("utf-8")).hexdigest(),
            title=title, content_text=body, status="draft", created_by=by,
        )
        session.add(doc)
        await session.commit()
        await session.refresh(doc)
        await self._ingest_one(session, tenant_id, str(doc.id), reason="manual", by=by)
        await self.audit(session, tenant_id, by, "knowledge.create", "knowledge", str(doc.id), detail={"title": title, "kind": kind})
        return {"ok": True, "id": str(doc.id), "rel": rel}

    async def rebuild_index(self, session: AsyncSession, tenant_id: Any, by: Any = None) -> dict[str, Any]:
        job = TrainJob(tenant_id=tenant_id, kind="retrain", status="running", progress=0, started_by=by)
        session.add(job)
        await session.commit()
        await session.refresh(job)
        task = asyncio.create_task(self._rebuild_job(job_id=str(job.id), tenant_id=tenant_id, by=by))
        self._jobs[str(job.id)] = task
        return {"job_id": str(job.id)}

    async def _rebuild_job(self, *, job_id: str, tenant_id: Any, by: Any) -> None:
        async with async_session_factory() as session:
            try:
                await self._update_job(session, job_id, tenant_id, 10, "Scanning knowledge documents")
                docs = (await session.scalars(select(AdminDocument).where(AdminDocument.tenant_id == tenant_id))).all()
                await session.execute(delete(DocumentChunk).where(DocumentChunk.tenant_id == tenant_id))
                total = len(docs) or 1
                for index, doc in enumerate(docs, start=1):
                    if doc.status == "error":
                        continue
                    path = self.docs_dir / doc.path
                    text = ""
                    try:
                        text = _extract_text(path) or doc.content_text
                    except Exception:
                        text = doc.content_text
                    if not text.strip():
                        doc.status = "error"
                        doc.error = "No extractable text."
                        await session.commit()
                        continue
                    source_id = f"documents/{doc.path}"
                    await self.rag.ingest_text(session, tenant_id=tenant_id, source_id=source_id, text=text,
                                               metadata={"doc_id": str(doc.id), "name": doc.name, "kind": doc.kind})
                    doc.status = "indexed"
                    doc.error = ""
                    doc.last_indexed_at = func.now()
                    await self._update_job(session, job_id, tenant_id,
                                           progress=10 + int(index / total * 80),
                                           message=f"Re-embedding {index} of {total} documents")
                await session.commit()
                await self._update_job(session, job_id, tenant_id, 92, "Rebuilding lexical index")
                await asyncio.to_thread(self.knowledge.refresh)
                await self._finish_job(session, job_id, tenant_id, "done", 100, "Knowledge base fully re-trained")
                await self.notify(session, tenant_id, "success", "Retraining complete", "The knowledge base has been fully re-indexed.")
            except Exception as exc:
                logger.exception("rebuild_job_failed", job_id=job_id)
                await self._finish_job(session, job_id, tenant_id, "error", 100, f"Retraining failed: {exc}")
                await self.notify(session, tenant_id, "error", "Retraining failed", str(exc))

    async def sync_sites(self, session: AsyncSession, tenant_id: Any, by: Any = None) -> dict[str, Any]:
        job = TrainJob(tenant_id=tenant_id, kind="sync", status="running", progress=0, started_by=by)
        session.add(job)
        await session.commit()
        await session.refresh(job)
        task = asyncio.create_task(self._sync_job(job_id=str(job.id), tenant_id=tenant_id, by=by))
        self._jobs[str(job.id)] = task
        return {"job_id": str(job.id)}

    async def _sync_job(self, *, job_id: str, tenant_id: Any, by: Any) -> None:
        async with async_session_factory() as session:
            try:
                await self._update_job(session, job_id, tenant_id, 20, "Crawling configured sites")
                await asyncio.to_thread(self.knowledge.refresh)
                await self._update_job(session, job_id, tenant_id, 90, "Refreshed site + document index")
                status = self.knowledge.status()
                await self._finish_job(session, job_id, tenant_id, "done", 100,
                                       f"Sync complete: {status['source_count']} sources, {status['chunk_count']} chunks")
                await self.notify(session, tenant_id, "success", "Knowledge sync complete",
                                  f"{status['source_count']} sources indexed.")
            except Exception as exc:
                logger.exception("sync_job_failed", job_id=job_id)
                await self._finish_job(session, job_id, tenant_id, "error", 100, f"Sync failed: {exc}")

    # =========================================================================
    # Unanswered questions
    # =========================================================================

    def _unanswered_confidence(self, *, answered: bool, answer_len: int, tool_calls: int, has_context: bool) -> float:
        if not answered:
            return 0.15
        score = 0.5
        if tool_calls > 0:
            score += 0.2
        if 150 <= answer_len <= 2500:
            score += 0.1
        if has_context:
            score += 0.2
        return round(max(0.0, min(1.0, score)), 2)

    async def record_metrics(
        self,
        session: AsyncSession,
        tenant_id: Any,
        *,
        conversation_id: Any,
        question: str,
        answer: str,
        response_time_ms: int,
        tool_calls: int,
        citations: list[str],
    ) -> dict[str, Any]:
        lower = answer.lower()
        answered = not any(phrase in lower for phrase in UNANSWERED_PHRASES)
        confidence = self._unanswered_confidence(
            answered=answered, answer_len=len(answer), tool_calls=tool_calls, has_context=len(citations) > 0,
        )
        session.add(AnswerMetric(
            tenant_id=tenant_id, conversation_id=conversation_id, question=question,
            answer_length=len(answer), response_time_ms=response_time_ms,
            tool_calls=tool_calls, answered=answered, confidence=confidence,
        ))
        await session.commit()
        if not answered or confidence < 0.35:
            await self.capture_unanswered(session, tenant_id, question=question, conversation_id=conversation_id, confidence=confidence)
        return {"answered": answered, "confidence": confidence}

    async def capture_unanswered(self, session: AsyncSession, tenant_id: Any, *, question: str, conversation_id: Any, confidence: float) -> None:
        cutoff = func.now() - func.make_interval(0, 0, 0, 0, 48)
        recent = (await session.scalars(
            select(UnansweredQuestion)
            .where(UnansweredQuestion.tenant_id == tenant_id, UnansweredQuestion.created_at >= cutoff)
            .order_by(UnansweredQuestion.created_at.desc())
            .limit(50)
        )).all()
        target = _normalize(question)
        for row in recent:
            if SequenceMatcher(None, target, _normalize(row.question)).ratio() > 0.88:
                return  # already captured
        session.add(UnansweredQuestion(
            tenant_id=tenant_id, question=question, conversation_id=conversation_id,
            source="auto" if confidence > 0 else "low_confidence", confidence=confidence, status="new",
        ))
        await session.commit()
        await self.notify(session, tenant_id, "warning", "Unanswered question detected",
                          f"\"{question[:80]}\" needs an answer.", link="/unanswered")

    async def list_unanswered(self, session: AsyncSession, tenant_id: Any, *, status: str = "", q: str = "", limit: int = 200, offset: int = 0) -> dict[str, Any]:
        stmt = select(UnansweredQuestion).where(UnansweredQuestion.tenant_id == tenant_id)
        if status:
            stmt = stmt.where(UnansweredQuestion.status == status)
        if q:
            stmt = stmt.where(UnansweredQuestion.question.ilike(f"%{q}%"))
        total = await session.scalar(select(func.count()).select_from(UnansweredQuestion).where(UnansweredQuestion.tenant_id == tenant_id))
        rows = (await session.scalars(stmt.order_by(UnansweredQuestion.created_at.desc()).limit(limit).offset(offset))).all()
        return {"items": [self._uq_payload(qrow) for qrow in rows], "total": total or 0, "limit": limit, "offset": offset}

    async def answer_unanswered(self, session: AsyncSession, tenant_id: Any, uq_id: str, *, answer: str, status: str, by: Any = None) -> dict[str, Any]:
        row = await session.get(UnansweredQuestion, uq_id)
        if row is None or row.tenant_id != tenant_id:
            raise ValueError("unanswered question not found")
        row.answer = answer
        row.status = status
        row.answer_by = by
        row.answer_at = func.now()
        await session.commit()
        await self.audit(session, tenant_id, by, "unanswered.answer", "unanswered", uq_id,
                         detail={"question": row.question, "status": status})
        if status == "approved":
            await self.add_manual_document(session, tenant_id, title=row.question[:80], content=answer,
                                          by=by, kind="unanswered")
            await self.notify(session, tenant_id, "success", "Answer approved",
                              "The approved answer was added to the knowledge base.", link="/knowledge")
        return {"ok": True}

    # =========================================================================
    # Audit + notifications
    # =========================================================================

    async def audit(self, session: AsyncSession, tenant_id: Any, by: Any, action: str, target_type: str = "", target_id: str = "", *, detail: dict[str, Any] | None = None, email: str = "", role: str = "", ip: str = "") -> None:
        if not email and by is not None:
            from db.models import User as UserModel
            actor = await session.get(UserModel, by)
            if actor is not None:
                email = actor.email
                role = role or actor.role
        session.add(AuditLog(
            tenant_id=tenant_id, user_id=by, email=email, role=role, action=action,
            target_type=target_type, target_id=target_id, detail=detail or {}, ip=ip,
        ))
        await session.commit()

    async def list_audit(self, session: AsyncSession, tenant_id: Any, *, action: str = "", limit: int = 200, offset: int = 0) -> dict[str, Any]:
        stmt = select(AuditLog).where(AuditLog.tenant_id == tenant_id)
        if action:
            stmt = stmt.where(AuditLog.action == action)
        total = await session.scalar(select(func.count()).select_from(AuditLog).where(AuditLog.tenant_id == tenant_id))
        rows = (await session.scalars(stmt.order_by(AuditLog.created_at.desc()).limit(limit).offset(offset))).all()
        return {"items": [
            {"id": str(r.id), "user_id": str(r.user_id) if r.user_id else None, "email": r.email, "role": r.role,
             "action": r.action, "target_type": r.target_type, "target_id": r.target_id, "detail": r.detail,
             "ip": r.ip, "created_at": str(r.created_at)} for r in rows
        ], "total": total or 0, "limit": limit, "offset": offset}

    async def notify(self, session: AsyncSession, tenant_id: Any, level: str, title: str, message: str, *, link: str = "") -> None:
        session.add(Notification(tenant_id=tenant_id, level=level, title=title, message=message, link=link))
        await session.commit()

    async def list_notifications(self, session: AsyncSession, tenant_id: Any, *, limit: int = 100) -> dict[str, Any]:
        rows = (await session.scalars(
            select(Notification).where(Notification.tenant_id == tenant_id).order_by(Notification.created_at.desc()).limit(limit)
        )).all()
        unread = await session.scalar(
            select(func.count()).select_from(Notification).where(Notification.tenant_id == tenant_id, Notification.read.is_(False))
        )
        return {"items": [
            {"id": str(n.id), "level": n.level, "title": n.title, "message": n.message, "link": n.link,
             "read": n.read, "created_at": str(n.created_at)} for n in rows
        ], "unread": unread or 0}

    async def mark_notifications_read(self, session: AsyncSession, tenant_id: Any, ids: list[str] | None = None) -> None:
        stmt = select(Notification).where(Notification.tenant_id == tenant_id)
        if ids:
            stmt = stmt.where(Notification.id.in_(list(ids)))
        rows = (await session.scalars(stmt)).all()
        for row in rows:
            row.read = True
        await session.commit()

    # =========================================================================
    # Train jobs
    # =========================================================================

    async def _update_job(self, session: AsyncSession, job_id: str, tenant_id: Any, progress: int, message: str, log: str = "") -> None:
        job = await session.get(TrainJob, job_id)
        if job is None or job.tenant_id != tenant_id:
            return
        job.progress = progress
        job.message = message
        if log:
            logs = list(job.logs or [])
            logs.append({"ts": time.time(), "message": log})
            job.logs = logs[-50:]
        await session.commit()

    async def _finish_job(self, session: AsyncSession, job_id: str, tenant_id: Any, status: str, progress: int, message: str) -> None:
        job = await session.get(TrainJob, job_id)
        if job is None or job.tenant_id != tenant_id:
            return
        job.status = status
        job.progress = progress
        job.message = message
        job.finished_at = func.now()
        await session.commit()

    async def list_jobs(self, session: AsyncSession, tenant_id: Any, *, limit: int = 50) -> dict[str, Any]:
        rows = (await session.scalars(
            select(TrainJob).where(TrainJob.tenant_id == tenant_id).order_by(TrainJob.started_at.desc()).limit(limit)
        )).all()
        return {"items": [
            {"id": str(j.id), "kind": j.kind, "status": j.status, "progress": j.progress, "message": j.message,
             "logs": j.logs, "created_at": str(j.started_at), "finished_at": str(j.finished_at) if j.finished_at else None} for j in rows
        ]}

    # =========================================================================
    # API keys
    # =========================================================================

    async def list_api_keys(self, session: AsyncSession, tenant_id: Any) -> list[dict[str, Any]]:
        current = await self.load_settings(session, tenant_id)
        return list(current.get("api_keys", []))

    async def create_api_key(self, session: AsyncSession, tenant_id: Any, name: str, by: Any = None) -> dict[str, Any]:
        current = await self.load_settings(session, tenant_id)
        keys = list(current.get("api_keys", []))
        prefix = "trym"
        secret = secrets.token_hex(20)
        full = f"{prefix}_{name.lower().replace(' ', '_')[:20]}_{secret}"
        keys.append({"name": name, "key": full, "prefix": full[:16], "created_at": time.time()})
        await self.set_settings(session, tenant_id, {"api_keys": keys}, by)
        await self.audit(session, tenant_id, by, "api_keys.create", "api_keys", "", detail={"name": name})
        return {"name": name, "key": full}

    async def delete_api_key(self, session: AsyncSession, tenant_id: Any, index: int, by: Any = None) -> dict[str, Any]:
        current = await self.load_settings(session, tenant_id)
        keys = list(current.get("api_keys", []))
        if 0 <= index < len(keys):
            keys.pop(index)
            await self.set_settings(session, tenant_id, {"api_keys": keys}, by)
            await self.audit(session, tenant_id, by, "api_keys.delete", "api_keys", "", detail={"index": index})
        return {"ok": True}

    # =========================================================================
    # Backup / restore
    # =========================================================================

    async def export_backup(self, session: AsyncSession, tenant_id: Any) -> io.BytesIO:
        docs = (await session.scalars(select(AdminDocument).where(AdminDocument.tenant_id == tenant_id))).all()
        settings_rows = await self.load_settings(session, tenant_id)
        unanswered = (await session.scalars(
            select(UnansweredQuestion).where(UnansweredQuestion.tenant_id == tenant_id, UnansweredQuestion.status.in_(["answered", "approved"]))
        )).all()
        manifest: dict[str, Any] = {
            "exported_at": time.time(),
            "tenant_id": str(tenant_id),
            "documents": [self._doc_payload(d) for d in docs],
            "settings": settings_rows,
            "unanswered": [{"question": u.question, "answer": u.answer, "status": u.status} for u in unanswered],
        }
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("manifest.json", json.dumps(manifest, indent=2))
            for doc in docs:
                path = self.docs_dir / doc.path
                if path.is_file():
                    zf.write(path, arcname=f"documents/{doc.path}")
        buffer.seek(0)
        return buffer

    async def restore_backup(self, session: AsyncSession, tenant_id: Any, data: bytes, by: Any = None) -> dict[str, Any]:
        try:
            with zipfile.ZipFile(io.BytesIO(data)) as zf:
                manifest_raw = zf.read("manifest.json")
                manifest = json.loads(manifest_raw.decode("utf-8"))
                files: dict[str, bytes] = {}
                for info in zf.infolist():
                    if info.filename.startswith("documents/") and not info.is_dir():
                        files[info.filename[len("documents/"):]] = zf.read(info)
        except Exception as exc:
            raise ValueError(f"invalid backup archive: {exc}") from exc

        for doc_payload in manifest.get("documents", []):
            rel = doc_payload.get("path", "")
            name = doc_payload.get("name", rel)
            content = doc_payload.get("content_text", "")
            path = self.docs_dir / rel if rel else None
            if path is not None:
                path.parent.mkdir(parents=True, exist_ok=True)
                if rel in files:
                    path.write_bytes(files[rel])
                elif content:
                    path.write_text(content, encoding="utf-8")
            checksum = hashlib.sha256(path.read_bytes() if path is not None and path.is_file() else content.encode("utf-8")).hexdigest()
            existing = await session.scalar(select(AdminDocument).where(AdminDocument.tenant_id == tenant_id, AdminDocument.path == rel))
            if existing is None:
                session.add(AdminDocument(
                    tenant_id=tenant_id, name=name, path=rel, kind=doc_payload.get("kind", "file"),
                    ext=doc_payload.get("ext", Path(rel).suffix), size_bytes=doc_payload.get("size_bytes", 0),
                    checksum=checksum, title=doc_payload.get("title", ""), content_text=content, status="draft", created_by=by,
                ))
            else:
                existing.content_text = content
                existing.status = "draft"
        for uq in manifest.get("unanswered", []):
            existing = await session.scalar(select(UnansweredQuestion).where(
                UnansweredQuestion.tenant_id == tenant_id, UnansweredQuestion.question == uq["question"]
            ))
            if existing is None:
                session.add(UnansweredQuestion(
                    tenant_id=tenant_id, question=uq["question"], answer=uq["answer"],
                    status="approved", source="restore", confidence=1.0,
                ))
        settings_payload = manifest.get("settings", {})
        for key in DEFAULT_SETTINGS:
            if key in settings_payload:
                await self.set_settings(session, tenant_id, {key: settings_payload[key]}, by)
        await session.commit()
        job = TrainJob(tenant_id=tenant_id, kind="retrain", status="running", progress=0, started_by=by)
        session.add(job)
        await session.commit()
        await session.refresh(job)
        task = asyncio.create_task(self._rebuild_job(job_id=str(job.id), tenant_id=tenant_id, by=by))
        self._jobs[str(job.id)] = task
        await self.audit(session, tenant_id, by, "backup.restore", "backup", "", detail={"docs": len(manifest.get("documents", []))})
        await self.notify(session, tenant_id, "success", "Backup restored", "Knowledge base restored; retraining in background.")
        return {"job_id": str(job.id)}

    # =========================================================================
    # Feedback
    # =========================================================================

    async def submit_feedback(self, session: AsyncSession, tenant_id: Any, *, rating: int, comment: str = "", conversation_id: Any = None, message_id: Any = None) -> None:
        rating = max(1, min(5, rating))
        session.add(MessageFeedback(
            tenant_id=tenant_id, conversation_id=conversation_id, message_id=message_id,
            rating=rating, comment=comment,
        ))
        await session.commit()

    async def list_feedback(self, session: AsyncSession, tenant_id: Any, *, limit: int = 200) -> dict[str, Any]:
        rows = (await session.scalars(
            select(MessageFeedback).where(MessageFeedback.tenant_id == tenant_id).order_by(MessageFeedback.created_at.desc()).limit(limit)
        )).all()
        return {"items": [
            {"id": str(f.id), "rating": f.rating, "comment": f.comment,
             "conversation_id": str(f.conversation_id) if f.conversation_id else None,
             "created_at": str(f.created_at)} for f in rows
        ]}

    # =========================================================================
    # Health
    # =========================================================================

    async def health(self, session: AsyncSession, tenant_id: Any) -> dict[str, Any]:
        db_ok = True
        try:
            await session.execute(select(1))
        except Exception:
            db_ok = False
        knowledge_status = self.knowledge.status()
        chunk_total = 0
        with suppress(Exception):
            chunk_total = await session.scalar(select(func.count()).select_from(DocumentChunk).where(DocumentChunk.tenant_id == tenant_id)) or 0
        storage_ok = True
        try:
            self.docs_dir.mkdir(parents=True, exist_ok=True)
        except Exception:
            storage_ok = False
        llm_ok = bool(settings.anthropic_api_key) or settings.app_env == "development"
        embedding_ok = bool(settings.embeddings_api_key) or settings.app_env == "development"
        embedding_detail = f"{settings.embeddings_model} (local-hash fallback)" if not settings.embeddings_api_key else settings.embeddings_model
        components = {
            "database": {"ok": db_ok, "detail": "PostgreSQL + pgvector"},
            "knowledge_store": {"ok": bool(knowledge_status.get("chunk_count")), "detail": f"{knowledge_status.get('chunk_count', 0)} chunks / {knowledge_status.get('source_count', 0)} sources"},
            "vector_index": {"ok": True, "detail": f"{chunk_total} embedded chunks"},
            "storage": {"ok": storage_ok, "detail": str(self.docs_dir)},
            "llm": {"ok": llm_ok, "detail": settings.anthropic_model},
            "embeddings": {"ok": embedding_ok, "detail": embedding_detail},
        }
        degraded = [name for name, comp in components.items() if not comp["ok"]]
        return {"status": "degraded" if degraded else "healthy", "components": components, "last_refresh": knowledge_status.get("last_refresh")}

    # =========================================================================
    # Helpers
    # =========================================================================

    @staticmethod
    def _safe_rel(name: str) -> str:
        cleaned = name.replace("\\", "/").strip("/")
        cleaned = "/".join(part for part in cleaned.split("/") if part not in {"", ".", ".."})
        return cleaned or "unnamed"

    @staticmethod
    def _doc_payload(doc: AdminDocument) -> dict[str, Any]:
        return {
            "id": str(doc.id), "name": doc.name, "path": doc.path, "kind": doc.kind, "ext": doc.ext,
            "size_bytes": doc.size_bytes, "checksum": doc.checksum, "version": doc.version,
            "title": doc.title, "content_text": doc.content_text, "meta": doc.meta,
            "status": doc.status, "error": doc.error,
            "created_by": str(doc.created_by) if doc.created_by else None,
            "created_at": str(doc.created_at), "updated_at": str(doc.updated_at),
            "last_indexed_at": str(doc.last_indexed_at) if doc.last_indexed_at else None,
        }

    @staticmethod
    def _uq_payload(row: UnansweredQuestion) -> dict[str, Any]:
        return {
            "id": str(row.id), "question": row.question, "conversation_id": str(row.conversation_id) if row.conversation_id else None,
            "source": row.source, "status": row.status, "answer": row.answer, "confidence": row.confidence,
            "answer_by": str(row.answer_by) if row.answer_by else None,
            "created_at": str(row.created_at), "updated_at": str(row.updated_at),
        }

    async def export_conversations_csv(self, session: AsyncSession, tenant_id: Any) -> str:
        from db.models import Conversation
        rows = (await session.execute(
            select(Message, Conversation)
            .join(Conversation, Conversation.id == Message.conversation_id)
            .where(Message.tenant_id == tenant_id)
            .order_by(Message.created_at)
        )).all()
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(["conversation_id", "role", "content", "created_at"])
        for msg, conv in rows:
            writer.writerow([str(conv.id), msg.role, msg.content, str(msg.created_at)])
        return buffer.getvalue()


def re_slug(text: str) -> str:
    slug = _re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug[:60]
