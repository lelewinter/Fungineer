# Fungineer backend (FastAPI)

Save/load + healthcheck service for the Fungineer game. Persists `HubState`
snapshots to a SQLite file. State payloads are opaque — the frontend owns
the schema.

## Run locally

```bash
cd backend
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # optional
uvicorn main:app --reload --port 8000
```

API is now at `http://localhost:8000`. Try:

- `GET  /healthz` → liveness probe
- `GET  /docs` → interactive OpenAPI docs
- `POST /api/state/save` → `{ "slot_id": "default", "state": {...} }`
- `GET  /api/state/{slot_id}` → returns the saved state
- `DELETE /api/state/{slot_id}` → wipes the slot

## Environment variables

| Var | Effect |
|---|---|
| `PORT` | Bind port (Railway sets it automatically). Locally use `--port`. |
| `FUNGINEER_DB` | SQLite file path. Default `fungineer.db`. |
| `FRONTEND_URL` | Adds your prod frontend origin to the CORS allowlist (e.g. `https://fungineer.pages.dev`). `*.pages.dev` previews are already allowed via regex. |

## Deploy to Railway

1. `railway login` (or use the dashboard).
2. New service → connect this repo → set **root** to `backend/`.
3. Railway picks up `Procfile` automatically (`uvicorn main:app --host 0.0.0.0 --port $PORT`).
4. Set env vars in the Railway dashboard:
   - `FRONTEND_URL` = your Cloudflare Pages URL (e.g. `https://fungineer.pages.dev`)
   - (optional) `FUNGINEER_DB` = `/data/fungineer.db` if you attach a volume for persistence.
5. Deploy. Note the public URL — that's what you'll set as `VITE_API_URL` in the frontend.

SQLite persistence on Railway: by default the FS is ephemeral. Attach a
**Volume** mounted at `/data` and point `FUNGINEER_DB=/data/fungineer.db`
for save data to survive restarts. For real durability, swap to Postgres
later (the `_db()` context manager is the only thing to change).
