/**
 * SaveService — O "ponto de salvamento" do progresso.
 * ---------------------------------------------------
 * Em linguagem simples: e quem guarda e recupera o progresso do jogador. Salva
 * em DOIS lugares:
 *   1. localStorage (sempre): a memoria do proprio navegador — funciona ate
 *      sem internet.
 *   2. servidor (backend), quando configurado: o "save na nuvem".
 *
 * Ao iniciar, ele tenta carregar primeiro da nuvem, depois do navegador e, se
 * nao houver nada, usa os valores padrao. Durante o jogo, salva sozinho sempre
 * que o HubState muda — mas com "debounce": em vez de salvar a cada micro-
 * mudanca, espera 1,5s de calmaria e salva uma vez so, evitando excesso de
 * gravacoes.
 *
 * O `slotId` e um identificador secreto por dispositivo (vem do ApiClient),
 * para que o save na nuvem de um aparelho nao seja lido nem sobrescrito por
 * outro.
 *
 * E um singleton: existe UMA instancia (`saveService`), exportada no fim.
 */

import { apiClient } from '../core/ApiClient';
import { HubState, type HubStateSnapshot } from './HubState';

// Chave do save no navegador. O "v1" e a versao do formato deste save local.
const STORAGE_KEY = 'fungineer.save.v1';
// Quanto tempo esperar de calmaria antes de gravar (o "debounce").
const SAVE_DEBOUNCE_MS = 1500;

class SaveServiceClass {
  // Per-device slot (random secret) instead of a shared 'default' — so one
  // device's cloud save can't be read or clobbered by another.
  private slotId = apiClient.slotId;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private armed = false;

  /** Try remote → localStorage → defaults. Returns the source used. */
  async load(): Promise<'remote' | 'local' | 'default'> {
    if (apiClient.enabled) {
      const remote = await apiClient.loadState<HubStateSnapshot>(this.slotId);
      if (remote && HubState.loadFromSnapshot(remote.state)) {
        this.persistLocal();
        return 'remote';
      }
    }
    const raw = this.readLocal();
    if (raw && HubState.loadFromSnapshot(raw)) return 'local';
    return 'default';
  }

  /** Subscribe to every persistence-worthy HubState signal. Idempotent. */
  arm(): void {
    if (this.armed) return;
    this.armed = true;
    HubState.stockChanged.connect(() => this.scheduleSave());
    HubState.rocketPieceBuilt.connect(() => this.scheduleSave());
    HubState.deteriorationChanged.connect(() => this.scheduleSave());
    HubState.roomUnlockedSignal.connect(() => this.scheduleSave());
    HubState.hubVariantChanged.connect(() => this.scheduleSave());
  }

  /** Force-flush any pending debounced save. Call before scene transitions
   *  that lead away from gameplay if you want guaranteed durability. */
  async flush(): Promise<void> {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    await this.saveNow();
  }

  // ── Detalhes internos ────────────────────────────────────────────────────
  // Reagenda o salvamento: cada nova mudanca "reseta o cronometro", de modo que
  // so salvamos depois que as mudancas pararem por SAVE_DEBOUNCE_MS.
  private scheduleSave(): void {
    if (this.debounceTimer !== null) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      void this.saveNow();
    }, SAVE_DEBOUNCE_MS);
  }

  private async saveNow(): Promise<void> {
    const snap = HubState.toSnapshot();
    this.persistLocal(snap);
    if (apiClient.enabled) {
      await apiClient.saveState(this.slotId, snap);
    }
  }

  private readLocal(): HubStateSnapshot | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as HubStateSnapshot;
    } catch {
      return null;
    }
  }

  private persistLocal(snap?: HubStateSnapshot): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snap ?? HubState.toSnapshot()));
    } catch {
      // Quota / disabled storage — fail silently, remote save still runs.
    }
  }
}

export const saveService = new SaveServiceClass();
