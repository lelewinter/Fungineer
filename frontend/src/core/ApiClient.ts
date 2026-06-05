/**
 * ApiClient.ts — a "ponte" entre o jogo (frontend) e o servidor (backend).
 *
 * Este modulo conversa com o backend do Fungineer para salvar e carregar o
 * progresso do jogador na nuvem. Pontos importantes:
 *
 *   - O endereco do servidor vem de VITE_API_URL (definido na hora de compilar).
 *     Se estiver VAZIO, todos os metodos viram "no-ops" (nao fazem nada e devolvem
 *     null), e o jogo roda 100% no navegador — util para a versao publicada como
 *     site estatico, sem servidor associado.
 *
 *   - A API de save nao usa login. Em vez disso, cada aparelho guarda dois
 *     segredos aleatorios no navegador (localStorage): um `slot` (qual "gaveta"
 *     de save pertence a ele) e um `token` (prova de que e o dono). Juntos, eles
 *     impedem que alguem leia, sobrescreva ou apague o save de outra pessoa.
 *
 * Exporta uma unica instancia pronta: `apiClient`.
 */

// Le e normaliza a URL base do servidor (removendo a barra final, se houver).
const RAW_BASE = (import.meta.env.VITE_API_URL ?? '').trim();
const BASE = RAW_BASE.replace(/\/$/, '');

// ── Identidade do aparelho ───────────────────────────────────────────────────
// Chaves do localStorage onde guardamos os dois segredos por aparelho.
const DEVICE_SLOT_KEY = 'fungineer.device.slot.v1';
const DEVICE_TOKEN_KEY = 'fungineer.device.token.v1';

/** Gera um identificador aleatorio (UUID quando possivel; senao, um fallback). */
function randomId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  } catch { /* segue para o fallback abaixo */ }
  // Fallback para contextos nao-seguros / webviews antigos sem crypto.randomUUID.
  let s = '';
  for (let i = 0; i < 32; i++) s += Math.floor(Math.random() * 16).toString(16);
  return s;
}

/** Le o segredo guardado na chave; se nao existir, cria um novo e guarda. */
function readOrCreate(key: string): string {
  try {
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const fresh = randomId();
    localStorage.setItem(key, fresh);
    return fresh;
  } catch {
    // Armazenamento desabilitado (aba anonima) -> id temporario. O save remoto
    // simplesmente nao persiste entre sessoes, o que e aceitavel (o localStorage
    // e a fonte primaria de save).
    return randomId();
  }
}

/** Resposta do servidor ao salvar. */
export interface SaveResult {
  slot_id: string;
  updated_at: string;
}

/** Resposta do servidor ao carregar (traz o estado salvo em `state`). */
export interface LoadResult<T = unknown> {
  slot_id: string;
  state: T;
  updated_at: string;
}

class ApiClientClass {
  // Os dois segredos deste aparelho, lidos/criados no localStorage.
  private deviceSlot = readOrCreate(DEVICE_SLOT_KEY);
  private deviceToken = readOrCreate(DEVICE_TOKEN_KEY);

  /** True quando VITE_API_URL esta definido — ou seja, ha save/load remoto. */
  get enabled(): boolean {
    return BASE.length > 0;
  }

  get baseUrl(): string {
    return BASE;
  }

  /** O id da "gaveta" de save deste aparelho (um segredo aleatorio por aparelho). */
  get slotId(): string {
    return this.deviceSlot;
  }

  /** Monta os cabecalhos de autenticacao (envia o token de prova de dono). */
  private authHeaders(extra?: Record<string, string>): Record<string, string> {
    return { 'X-Device-Token': this.deviceToken, ...extra };
  }

  /** Verifica se o servidor esta no ar. Retorna false se nao houver backend. */
  async healthz(): Promise<boolean> {
    if (!this.enabled) return false;
    try {
      const res = await fetch(`${BASE}/healthz`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  }

  /** Salva o estado do jogo na nuvem. Devolve null se falhar ou nao houver backend. */
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

  /** Carrega o estado salvo na nuvem. Devolve null se nao existir ou falhar. */
  async loadState<T>(slotId: string): Promise<LoadResult<T> | null> {
    if (!this.enabled) return null;
    try {
      const res = await fetch(`${BASE}/api/state/${encodeURIComponent(slotId)}`, {
        headers: this.authHeaders(),
      });
      // 404 = nao ha save para este aparelho ainda (situacao normal, nao erro).
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

  /** Apaga o save remoto deste aparelho. Devolve true em caso de sucesso. */
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

/** Instancia unica e compartilhada do cliente da API. */
export const apiClient = new ApiClientClass();
