/** Thin client for the Fungineer backend.
 *
 *  Reads `VITE_API_URL` at build time. When empty, all methods become no-ops
 *  / return `null`, so the game still runs as a pure-frontend app — useful
 *  for the static Cloudflare Pages deploy without a paired backend.
 *
 *  Slot ownership: every request carries an `X-Owner-Secret` header that
 *  pins the slot to this install. The secret is generated on first run and
 *  kept in localStorage. The backend treats a slot belonging to a different
 *  secret as nonexistent, which blocks the trivial "overwrite anyone's save"
 *  attack on the unauthenticated endpoints. */

const RAW_BASE = (import.meta.env.VITE_API_URL ?? '').trim();
const BASE = RAW_BASE.replace(/\/$/, '');

const OWNER_SECRET_KEY = 'fungineer.owner_secret.v1';

function generateOwnerSecret(): string {
  // 32 bytes → 43 url-safe base64 chars, comfortably inside the server's
  // 16-128 char window. crypto.getRandomValues is available in every browser
  // we target (Vite's `target: 'es2022'`).
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function getOwnerSecret(): string {
  try {
    const cached = localStorage.getItem(OWNER_SECRET_KEY);
    if (cached && /^[A-Za-z0-9_-]{16,128}$/.test(cached)) return cached;
    const fresh = generateOwnerSecret();
    localStorage.setItem(OWNER_SECRET_KEY, fresh);
    return fresh;
  } catch {
    // Storage disabled — fall back to a per-session token. The user just
    // loses cross-session remote save access; localStorage save still works.
    return generateOwnerSecret();
  }
}

export interface SaveResult {
  slot_id: string;
  updated_at: string;
}

export interface LoadResult<T = unknown> {
  slot_id: string;
  state: T;
  updated_at: string;
}

class ApiClientClass {
  /** True when VITE_API_URL is set — i.e. remote save/load is available. */
  get enabled(): boolean {
    return BASE.length > 0;
  }

  get baseUrl(): string {
    return BASE;
  }

  private authHeaders(extra?: Record<string, string>): Record<string, string> {
    return { 'X-Owner-Secret': getOwnerSecret(), ...(extra ?? {}) };
  }

  async healthz(): Promise<boolean> {
    if (!this.enabled) return false;
    try {
      const res = await fetch(`${BASE}/healthz`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  }

  async saveState<T>(slotId: string, state: T): Promise<SaveResult | null> {
    if (!this.enabled) return null;
    try {
      const res = await fetch(`${BASE}/api/state/save`, {
        method: 'POST',
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ slot_id: slotId, state }),
      });
      if (!res.ok) {
        console.warn('[api] saveState failed', res.status, await res.text());
        return null;
      }
      return (await res.json()) as SaveResult;
    } catch (err) {
      console.warn('[api] saveState error', err);
      return null;
    }
  }

  async loadState<T>(slotId: string): Promise<LoadResult<T> | null> {
    if (!this.enabled) return null;
    try {
      const res = await fetch(`${BASE}/api/state/${encodeURIComponent(slotId)}`, {
        headers: this.authHeaders(),
      });
      if (res.status === 404) return null;
      if (!res.ok) {
        console.warn('[api] loadState failed', res.status);
        return null;
      }
      return (await res.json()) as LoadResult<T>;
    } catch (err) {
      console.warn('[api] loadState error', err);
      return null;
    }
  }

  async deleteState(slotId: string): Promise<boolean> {
    if (!this.enabled) return false;
    try {
      const res = await fetch(`${BASE}/api/state/${encodeURIComponent(slotId)}`, {
        method: 'DELETE',
        headers: this.authHeaders(),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

export const apiClient = new ApiClientClass();
