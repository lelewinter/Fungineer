/** Thin client for the Fungineer backend.
 *
 *  Reads `VITE_API_URL` at build time. When empty, all methods become no-ops
 *  / return `null`, so the game still runs as a pure-frontend app — useful
 *  for the static Cloudflare Pages deploy without a paired backend. */

const RAW_BASE = (import.meta.env.VITE_API_URL ?? '').trim();
const BASE = RAW_BASE.replace(/\/$/, '');

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
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(`${BASE}/api/state/${encodeURIComponent(slotId)}`);
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
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

export const apiClient = new ApiClientClass();
