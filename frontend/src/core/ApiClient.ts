/** Thin client for the Fungineer backend.
 *
 *  Reads `VITE_API_URL` at build time. When empty, all methods become no-ops
 *  / return `null`, so the game still runs as a pure-frontend app — useful
 *  for the static Cloudflare Pages deploy without a paired backend. */

const RAW_BASE = (import.meta.env.VITE_API_URL ?? '').trim();
const BASE = RAW_BASE.replace(/\/$/, '');

// ── Device identity ─────────────────────────────────────────────────────────
// The save API is unauthenticated, so each device gets two random secrets kept
// in localStorage: a `slot` (which save row it owns) and a `token` (proof of
// ownership, sent as X-Device-Token). Together they stop anyone from reading,
// overwriting, or deleting another player's save.
const DEVICE_SLOT_KEY = 'fungineer.device.slot.v1';
const DEVICE_TOKEN_KEY = 'fungineer.device.token.v1';

function randomId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  } catch { /* fall through */ }
  // Fallback for non-secure contexts / old webviews.
  let s = '';
  for (let i = 0; i < 32; i++) s += Math.floor(Math.random() * 16).toString(16);
  return s;
}

function readOrCreate(key: string): string {
  try {
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const fresh = randomId();
    localStorage.setItem(key, fresh);
    return fresh;
  } catch {
    // Storage disabled (private mode) — ephemeral id; remote save just won't
    // persist across sessions, which is acceptable (localStorage is primary).
    return randomId();
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
  private deviceSlot = readOrCreate(DEVICE_SLOT_KEY);
  private deviceToken = readOrCreate(DEVICE_TOKEN_KEY);

  /** True when VITE_API_URL is set — i.e. remote save/load is available. */
  get enabled(): boolean {
    return BASE.length > 0;
  }

  get baseUrl(): string {
    return BASE;
  }

  /** This device's save slot id (a random per-device secret). */
  get slotId(): string {
    return this.deviceSlot;
  }

  private authHeaders(extra?: Record<string, string>): Record<string, string> {
    return { 'X-Device-Token': this.deviceToken, ...extra };
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
