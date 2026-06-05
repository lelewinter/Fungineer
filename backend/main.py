"""Fungineer backend — o "servidor de saves" do jogo (FastAPI).

Em linguagem simples: este programa roda num servidor e tem duas funcoes
principais:

  1. Guardar o progresso do jogador na nuvem (salvar/carregar/apagar). O
     progresso e o snapshot do HubState (pecas do foguete, personagens
     resgatados, lore, deterioracao, etc.). Para o servidor, esse conteudo e
     uma "caixa-preta" (payload opaco): ele apenas guarda o texto que o jogo
     manda, sem precisar entender as regras do jogo.
  2. Responder a um "healthcheck" (/healthz) — um sinal de "estou vivo" que
     servicos de monitoramento usam para conferir se o servidor esta no ar.

Onde os dados ficam: num arquivo SQLite local (um banco de dados simples num
unico arquivo). Em producao (estilo Railway), usa as variaveis de ambiente
(env vars) de PORT/HOST.

Seguranca em duas camadas (NAO ALTERAR a logica, apenas entender):
  - X-Device-Token: cada pedido precisa trazer um "token" (uma senha secreta do
    aparelho). Esse token amarra um save a um unico dispositivo, para que o save
    de um aparelho nao seja lido, sobrescrito ou apagado por outro.
  - CORS: lista de quais sites (origens) tem permissao de falar com esta API.

Como rodar localmente:
    uvicorn main:app --reload --port 8000

Como rodar em producao (estilo Railway):
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
    """Cria a tabela de saves se ela ainda nao existir e migra bancos antigos.

    Cada linha da tabela e um "slot" de save: um id, o estado em texto (JSON),
    quando foi atualizado e o token do dono (owner_token). A migracao adiciona a
    coluna owner_token em bancos criados antes de existir a posse por aparelho.
    """
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
    """Exige o token do aparelho em todo save/load/delete.

    Todo pedido precisa trazer um device token. Ele e a senha secreta que liga
    um slot a um unico aparelho — sem ele, a API deixaria qualquer um ler,
    sobrescrever ou apagar qualquer save. Sem token valido, devolve 401."""
    if not token or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="missing X-Device-Token",
        )
    return token.strip()


@contextmanager
def _db() -> Generator[sqlite3.Connection, None, None]:
    """Abre uma conexao com o banco e garante que ela seja fechada no fim.

    Usado com 'with _db() as conn:' — ao sair do bloco, a conexao fecha sozinha,
    mesmo que ocorra um erro no meio. row_factory=Row deixa ler colunas por nome
    (ex.: row["owner_token"]) em vez de por posicao."""
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
    """Resposta de um salvamento: qual slot e quando foi atualizado."""
    slot_id: str
    updated_at: str


class LoadStateResponse(BaseModel):
    """Resposta de um carregamento: o slot, o estado salvo e a data dele."""
    slot_id: str
    state: dict[str, Any]
    updated_at: str


class HealthResponse(BaseModel):
    """Resposta do healthcheck: confirma que o servico esta de pe."""
    status: str
    service: str
    time: str


# ── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Fungineer API",
    description="Save/load endpoints + healthcheck for the Fungineer game.",
    version="0.1.0",
)

# CORS: define quais sites (origens) o navegador autoriza a chamar esta API.
# allow_credentials=False porque a autenticacao e por header (X-Device-Token),
# nao por cookie; e so liberamos os metodos HTTP que realmente usamos.
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
    """Salva (ou atualiza) o progresso de um slot.

    Passos: exige o token; limita o tamanho do payload (anti-abuso); confere a
    posse do slot (so o dono, ou um slot legado sem dono, pode escrever); e por
    fim grava — inserindo um slot novo ou atualizando o existente."""
    token = _require_token(x_device_token)
    updated_at = datetime.now(tz=timezone.utc).isoformat()
    # Transforma o estado em texto JSON e checa o tamanho em bytes (e o tamanho
    # real gravado que importa, por isso medimos os bytes UTF-8, nao caracteres).
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
    """Carrega o progresso de um slot, se o token pertencer ao dono dele.

    Importante: quando o token nao bate, devolvemos 404 (e nao 403) de proposito
    — assim nao revelamos sequer que o slot existe para quem nao e o dono."""
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
    """Apaga um slot — somente o aparelho dono (ou um slot legado sem dono) pode.

    Responde 204 (sucesso, sem conteudo) mesmo que nada tenha sido apagado, para
    nao revelar se o slot existia ou pertencia a outro aparelho."""
    token = _require_token(x_device_token)
    with _db() as conn:
        # Only the owning device (or an unclaimed legacy slot) can delete.
        conn.execute(
            "DELETE FROM save_slots WHERE slot_id = ? AND (owner_token IS NULL OR owner_token = ?)",
            (slot_id, token),
        )
        conn.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
