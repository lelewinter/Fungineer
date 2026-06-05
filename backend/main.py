"""Fungineer backend — FastAPI service.

Exposes save/load endpoints for HubState (rocket recipe progress, rescued
characters, lore, deterioration, etc) and a healthcheck. Persists to a local
SQLite file by default; on Railway, set DATABASE_URL or rely on PORT/HOST env.

Run locally:
    uvicorn main:app --reload --port 8000

Run in production (Railway-style):
    uvicorn main:app --host 0.0.0.0 --port $PORT
"""
from __future__ import annotations

import json
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Generator

from fastapi import FastAPI, Header, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


# ── Config ───────────────────────────────────────────────────────────────────

DB_PATH = Path(os.environ.get("FUNGINEER_DB", "fungineer.db"))

# Hard cap on a serialized save payload. A real HubState snapshot is a few KB;
# 256KB is generous headroom while preventing an unauthenticated client from
# bloating the DB / filling disk with an oversized blob.
MAX_STATE_BYTES = 256 * 1024

# CORS origins (tightened):
#   - localhost dev (Vite default 5173, preview 4173)
#   - the deployed frontend origin(s) in FRONTEND_URL (comma-separated for
#     prod + a custom domain, e.g. "https://lelelab.net,https://app.pages.dev")
#   - NO blanket "*.pages.dev" anymore. If you still want preview-deploy CORS,
#     opt in explicitly via FRONTEND_ORIGIN_REGEX (e.g. for your project's
#     subdomain pattern); it's unset by default so previews are NOT allowed.
DEFAULT_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:4173",
]
FRONTEND_URL = os.environ.get("FRONTEND_URL", "").strip()
_frontend_origins = [o.strip().rstrip("/") for o in FRONTEND_URL.split(",") if o.strip()]
ALLOWED_ORIGINS = DEFAULT_ORIGINS + _frontend_origins
FRONTEND_ORIGIN_REGEX = os.environ.get("FRONTEND_ORIGIN_REGEX", "").strip() or None


# ── DB helpers ───────────────────────────────────────────────────────────────

def _init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS save_slots (
                slot_id      TEXT PRIMARY KEY,
                state_json   TEXT NOT NULL,
                updated_at   TEXT NOT NULL,
                owner_token  TEXT
            )
            """
        )
        # Migrate older DBs that predate per-device ownership.
        cols = [r[1] for r in conn.execute("PRAGMA table_info(save_slots)").fetchall()]
        if "owner_token" not in cols:
            conn.execute("ALTER TABLE save_slots ADD COLUMN owner_token TEXT")
        conn.commit()


def _require_token(token: str | None) -> str:
    """Every save/load/delete must carry a device token. It's the secret that
    ties a slot to a single device — without it the API would let anyone
    read/overwrite/delete any slot."""
    if not token or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="missing X-Device-Token",
        )
    return token.strip()


@contextmanager
def _db() -> Generator[sqlite3.Connection, None, None]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


# ── Schemas ──────────────────────────────────────────────────────────────────

class SaveStatePayload(BaseModel):
    """Opaque snapshot of HubState — the frontend owns the schema and only
    asks us to persist whatever it sends back. Keeping it opaque avoids
    coupling the server to gameplay churn."""
    slot_id: str = Field(min_length=1, max_length=64)
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


# ── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Fungineer API",
    description="Save/load endpoints + healthcheck for the Fungineer game.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=FRONTEND_ORIGIN_REGEX,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _on_startup() -> None:
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
    return {"service": "fungineer-api", "docs": "/docs"}


@app.post(
    "/api/state/save",
    response_model=SaveStateResponse,
    status_code=status.HTTP_200_OK,
)
def save_state(
    payload: SaveStatePayload,
    x_device_token: str | None = Header(default=None),
) -> SaveStateResponse:
    token = _require_token(x_device_token)
    updated_at = datetime.now(tz=timezone.utc).isoformat()
    state_json = json.dumps(payload.state, ensure_ascii=False)
    if len(state_json.encode("utf-8")) > MAX_STATE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="state payload too large",
        )
    with _db() as conn:
        row = conn.execute(
            "SELECT owner_token FROM save_slots WHERE slot_id = ?",
            (payload.slot_id,),
        ).fetchone()
        # A slot is owned by the first device to write it (legacy rows have a
        # NULL owner_token and get claimed on next write). Reject other devices.
        if row is not None and row["owner_token"] not in (None, token):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="slot owned by another device",
            )
        conn.execute(
            """
            INSERT INTO save_slots (slot_id, state_json, updated_at, owner_token)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(slot_id) DO UPDATE SET
                state_json = excluded.state_json,
                updated_at = excluded.updated_at,
                owner_token = excluded.owner_token
            """,
            (payload.slot_id, state_json, updated_at, token),
        )
        conn.commit()
    return SaveStateResponse(slot_id=payload.slot_id, updated_at=updated_at)


@app.get(
    "/api/state/{slot_id}",
    response_model=LoadStateResponse,
)
def load_state(
    slot_id: str,
    x_device_token: str | None = Header(default=None),
) -> LoadStateResponse:
    token = _require_token(x_device_token)
    with _db() as conn:
        row = conn.execute(
            "SELECT state_json, updated_at, owner_token FROM save_slots WHERE slot_id = ?",
            (slot_id,),
        ).fetchone()
    # 404 (not 403) on a token mismatch so we don't reveal that the slot exists.
    if row is None or row["owner_token"] not in (None, token):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"slot {slot_id!r} not found",
        )
    return LoadStateResponse(
        slot_id=slot_id,
        state=json.loads(row["state_json"]),
        updated_at=row["updated_at"],
    )


@app.delete("/api/state/{slot_id}")
def delete_state(
    slot_id: str,
    x_device_token: str | None = Header(default=None),
) -> Response:
    token = _require_token(x_device_token)
    with _db() as conn:
        # Only the owning device (or an unclaimed legacy slot) can delete.
        conn.execute(
            "DELETE FROM save_slots WHERE slot_id = ? AND (owner_token IS NULL OR owner_token = ?)",
            (slot_id, token),
        )
        conn.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
