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

from fastapi import FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


# ── Config ───────────────────────────────────────────────────────────────────

DB_PATH = Path(os.environ.get("FUNGINEER_DB", "fungineer.db"))

# CORS origins:
#   - localhost dev (Vite default 5173, preview 4173)
#   - the deployed frontend URL set via FRONTEND_URL env (e.g. on Cloudflare Pages)
#   - any *.pages.dev preview (cloudflare convention) — covered by regex
DEFAULT_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:4173",
]
FRONTEND_URL = os.environ.get("FRONTEND_URL", "").strip()
ALLOWED_ORIGINS = DEFAULT_ORIGINS + ([FRONTEND_URL] if FRONTEND_URL else [])


# ── DB helpers ───────────────────────────────────────────────────────────────

def _init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS save_slots (
                slot_id      TEXT PRIMARY KEY,
                state_json   TEXT NOT NULL,
                updated_at   TEXT NOT NULL
            )
            """
        )
        conn.commit()


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
    allow_origin_regex=r"https://.*\.pages\.dev",
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
def save_state(payload: SaveStatePayload) -> SaveStateResponse:
    updated_at = datetime.now(tz=timezone.utc).isoformat()
    state_json = json.dumps(payload.state, ensure_ascii=False)
    with _db() as conn:
        conn.execute(
            """
            INSERT INTO save_slots (slot_id, state_json, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(slot_id) DO UPDATE SET
                state_json = excluded.state_json,
                updated_at = excluded.updated_at
            """,
            (payload.slot_id, state_json, updated_at),
        )
        conn.commit()
    return SaveStateResponse(slot_id=payload.slot_id, updated_at=updated_at)


@app.get(
    "/api/state/{slot_id}",
    response_model=LoadStateResponse,
)
def load_state(slot_id: str) -> LoadStateResponse:
    with _db() as conn:
        row = conn.execute(
            "SELECT state_json, updated_at FROM save_slots WHERE slot_id = ?",
            (slot_id,),
        ).fetchone()
    if row is None:
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
def delete_state(slot_id: str) -> Response:
    with _db() as conn:
        conn.execute("DELETE FROM save_slots WHERE slot_id = ?", (slot_id,))
        conn.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
