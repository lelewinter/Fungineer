"""Fungineer backend — FastAPI service.

Exposes save/load endpoints for HubState (rocket recipe progress, rescued
characters, lore, deterioration, etc) and a healthcheck. Persists to a local
SQLite file by default; on Railway, set DATABASE_URL or rely on PORT/HOST env.

Run locally:
    uvicorn main:app --reload --port 8000

Run in production (Railway-style):
    uvicorn main:app --host 0.0.0.0 --port $PORT

Slot ownership:
    The first request to a slot pins it to the client's ``X-Owner-Secret``
    header (a random per-install token kept by the client). Subsequent
    reads/writes/deletes must present the same secret, otherwise the server
    answers 404 (we never confirm slot existence to an unauthenticated
    caller). This blocks the trivial "overwrite anyone's save by guessing
    slot_id" attack without requiring real accounts.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Generator, Optional

from fastapi import FastAPI, Header, HTTPException, Path as PathParam, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp


# ── Config ───────────────────────────────────────────────────────────────────

DB_PATH = Path(os.environ.get("FUNGINEER_DB", "fungineer.db"))
ENV = os.environ.get("FUNGINEER_ENV", "development").lower()
IS_PROD = ENV in ("production", "prod")

# Hard cap on incoming request body. Saves serialise to ~2-3 KB today; 64 KB
# leaves room for growth while making it expensive to flood the DB.
MAX_BODY_BYTES = int(os.environ.get("FUNGINEER_MAX_BODY", str(64 * 1024)))

# Slot id grammar — keep it ASCII-safe so it can never trip URL routing or
# break the SQLite primary key. 1-64 chars, alphanumeric + dash + underscore.
SLOT_ID_PATTERN = r"^[A-Za-z0-9_-]{1,64}$"
SLOT_ID_RE = re.compile(SLOT_ID_PATTERN)

# Owner secret format: opaque token, 16-128 chars. We never store it raw —
# only an HMAC-SHA256 keyed by the per-DB pepper.
OWNER_SECRET_PATTERN = r"^[A-Za-z0-9_-]{16,128}$"
OWNER_SECRET_RE = re.compile(OWNER_SECRET_PATTERN)

# Pepper for hashing owner secrets. Falls back to a generated value on first
# startup so dev works out of the box; in production set FUNGINEER_PEPPER
# explicitly (env-pinned) or rotating it will invalidate every save.
_PEPPER = os.environ.get("FUNGINEER_PEPPER", "").encode("utf-8")

# CORS origins:
#   - localhost dev (Vite default 5173, preview 4173)
#   - the deployed frontend URL set via FRONTEND_URL env (e.g. on Cloudflare Pages)
#   - any *.pages.dev preview (anchored so it can't be widened by trailing chars)
DEFAULT_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:4173",
]
FRONTEND_URL = os.environ.get("FRONTEND_URL", "").strip()
ALLOWED_ORIGINS = DEFAULT_ORIGINS + ([FRONTEND_URL] if FRONTEND_URL else [])
PAGES_DEV_REGEX = r"^https://[a-z0-9-]+\.pages\.dev$"


# ── DB helpers ───────────────────────────────────────────────────────────────

def _init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS save_slots (
                slot_id            TEXT PRIMARY KEY,
                state_json         TEXT NOT NULL,
                owner_secret_hash  TEXT,
                updated_at         TEXT NOT NULL
            )
            """
        )
        # Migration: older deployments may have rows without the column.
        cols = {row[1] for row in conn.execute("PRAGMA table_info(save_slots)").fetchall()}
        if "owner_secret_hash" not in cols:
            conn.execute("ALTER TABLE save_slots ADD COLUMN owner_secret_hash TEXT")
        conn.commit()


@contextmanager
def _db() -> Generator[sqlite3.Connection, None, None]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def _hash_secret(secret: str) -> str:
    """HMAC-SHA256 of the owner secret, hex-encoded. The pepper prevents
    rainbow-table replay across instances even if the DB is leaked."""
    return hmac.new(_PEPPER, secret.encode("utf-8"), hashlib.sha256).hexdigest()


def _require_slot_id(slot_id: str) -> None:
    if not SLOT_ID_RE.match(slot_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="invalid slot_id",
        )


def _require_owner_secret(secret: Optional[str]) -> str:
    if secret is None or not OWNER_SECRET_RE.match(secret):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="missing or malformed X-Owner-Secret",
        )
    return secret


# ── Schemas ──────────────────────────────────────────────────────────────────

class SaveStatePayload(BaseModel):
    """Opaque snapshot of HubState — the frontend owns the schema and only
    asks us to persist whatever it sends back. Keeping it opaque avoids
    coupling the server to gameplay churn."""
    slot_id: str = Field(min_length=1, max_length=64, pattern=SLOT_ID_PATTERN)
    state: dict[str, Any]


class SaveStateResponse(BaseModel):
    slot_id: str
    updated_at: str


class LoadStateResponse(BaseModel):
    slot_id: str
    state: dict[str, Any]
    updated_at: str


class HealthResponse(BaseModel):
    status: str
    service: str
    time: str


# ── Middlewares ──────────────────────────────────────────────────────────────

class ContentLengthLimitMiddleware(BaseHTTPMiddleware):
    """Reject requests whose Content-Length header exceeds the cap, before any
    handler reads the body. Mutating routes (POST/PUT/PATCH/DELETE) are the
    only ones that need protection; we also short-circuit chunked uploads
    without a declared length."""

    def __init__(self, app: ASGIApp, *, max_bytes: int) -> None:
        super().__init__(app)
        self.max_bytes = max_bytes

    async def dispatch(self, request: Request, call_next):  # type: ignore[override]
        if request.method in ("POST", "PUT", "PATCH"):
            length_header = request.headers.get("content-length")
            if length_header is None:
                return Response(
                    status_code=status.HTTP_411_LENGTH_REQUIRED,
                    content="Content-Length required",
                )
            try:
                length = int(length_header)
            except ValueError:
                return Response(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    content="invalid Content-Length",
                )
            if length > self.max_bytes:
                return Response(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    content="payload too large",
                )
        return await call_next(request)


# ── App ──────────────────────────────────────────────────────────────────────

# OpenAPI docs are useful in dev but leak the full API surface in prod.
_docs_url = None if IS_PROD else "/docs"
_redoc_url = None if IS_PROD else "/redoc"
_openapi_url = None if IS_PROD else "/openapi.json"

app = FastAPI(
    title="Fungineer API",
    description="Save/load endpoints + healthcheck for the Fungineer game.",
    version="0.2.0",
    docs_url=_docs_url,
    redoc_url=_redoc_url,
    openapi_url=_openapi_url,
)

app.add_middleware(ContentLengthLimitMiddleware, max_bytes=MAX_BODY_BYTES)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=PAGES_DEV_REGEX,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "X-Owner-Secret"],
)


@app.on_event("startup")
def _on_startup() -> None:
    global _PEPPER
    if not _PEPPER:
        # Dev fallback. Logged loudly so prod misconfig is visible.
        _PEPPER = secrets.token_bytes(32)
        print(
            "[fungineer] WARNING: FUNGINEER_PEPPER not set; using an ephemeral "
            "pepper. All saves will be unrecoverable across restarts.",
            flush=True,
        )
    _init_db()


# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/healthz", response_model=HealthResponse)
def healthz() -> HealthResponse:
    """Liveness probe — Railway / Cloudflare uptime can ping this."""
    return HealthResponse(
        status="ok",
        service="fungineer-api",
        time=datetime.now(tz=timezone.utc).isoformat(),
    )


@app.get("/")
def root() -> dict[str, str]:
    return {"service": "fungineer-api"}


@app.post(
    "/api/state/save",
    response_model=SaveStateResponse,
    status_code=status.HTTP_200_OK,
)
def save_state(
    payload: SaveStatePayload,
    x_owner_secret: Optional[str] = Header(default=None, alias="X-Owner-Secret"),
) -> SaveStateResponse:
    secret = _require_owner_secret(x_owner_secret)
    secret_hash = _hash_secret(secret)

    updated_at = datetime.now(tz=timezone.utc).isoformat()
    state_json = json.dumps(payload.state, ensure_ascii=False)
    with _db() as conn:
        row = conn.execute(
            "SELECT owner_secret_hash FROM save_slots WHERE slot_id = ?",
            (payload.slot_id,),
        ).fetchone()
        if row is None:
            # Fresh slot — claim it.
            conn.execute(
                "INSERT INTO save_slots (slot_id, state_json, owner_secret_hash, updated_at) "
                "VALUES (?, ?, ?, ?)",
                (payload.slot_id, state_json, secret_hash, updated_at),
            )
        else:
            existing = row["owner_secret_hash"]
            if existing is None:
                # Legacy row from before ownership tracking — first writer claims it.
                conn.execute(
                    "UPDATE save_slots SET state_json = ?, owner_secret_hash = ?, updated_at = ? "
                    "WHERE slot_id = ?",
                    (state_json, secret_hash, updated_at, payload.slot_id),
                )
            elif hmac.compare_digest(existing, secret_hash):
                conn.execute(
                    "UPDATE save_slots SET state_json = ?, updated_at = ? WHERE slot_id = ?",
                    (state_json, updated_at, payload.slot_id),
                )
            else:
                # Don't confirm slot existence to a non-owner.
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="slot not found")
        conn.commit()
    return SaveStateResponse(slot_id=payload.slot_id, updated_at=updated_at)


@app.get(
    "/api/state/{slot_id}",
    response_model=LoadStateResponse,
)
def load_state(
    slot_id: str = PathParam(..., pattern=SLOT_ID_PATTERN, max_length=64),
    x_owner_secret: Optional[str] = Header(default=None, alias="X-Owner-Secret"),
) -> LoadStateResponse:
    _require_slot_id(slot_id)
    secret = _require_owner_secret(x_owner_secret)
    secret_hash = _hash_secret(secret)
    with _db() as conn:
        row = conn.execute(
            "SELECT state_json, owner_secret_hash, updated_at FROM save_slots WHERE slot_id = ?",
            (slot_id,),
        ).fetchone()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="slot not found")
    existing = row["owner_secret_hash"]
    if existing is not None and not hmac.compare_digest(existing, secret_hash):
        # Hide existence from non-owners.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="slot not found")
    return LoadStateResponse(
        slot_id=slot_id,
        state=json.loads(row["state_json"]),
        updated_at=row["updated_at"],
    )


@app.delete("/api/state/{slot_id}")
def delete_state(
    slot_id: str = PathParam(..., pattern=SLOT_ID_PATTERN, max_length=64),
    x_owner_secret: Optional[str] = Header(default=None, alias="X-Owner-Secret"),
) -> Response:
    _require_slot_id(slot_id)
    secret = _require_owner_secret(x_owner_secret)
    secret_hash = _hash_secret(secret)
    with _db() as conn:
        row = conn.execute(
            "SELECT owner_secret_hash FROM save_slots WHERE slot_id = ?",
            (slot_id,),
        ).fetchone()
        if row is None:
            # Idempotent delete — already gone.
            return Response(status_code=status.HTTP_204_NO_CONTENT)
        existing = row["owner_secret_hash"]
        if existing is not None and not hmac.compare_digest(existing, secret_hash):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="slot not found")
        conn.execute("DELETE FROM save_slots WHERE slot_id = ?", (slot_id,))
        conn.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
