/**
 * UpdateBanner — O "avisinho de atualizacao" na tela.
 * --------------------------------------------------
 * Em linguagem simples: e uma faixa (banner) que aparece sobre o jogo para
 * avisar que ha uma versao nova. Hoje as atualizacoes se aplicam sozinhas, entao
 * este banner serve principalmente para mostrar o breve aviso "Aplicando
 * atualizacao..." pouco antes de recarregar.
 *
 * Por que ele e feito com HTML/CSS comum (DOM) e nao dentro do PixiJS? Porque
 * durante as trocas de cena o "palco" do Pixi pode estar sendo reconstruido,
 * e este aviso precisa ficar acima de tudo, de forma simples e confiavel.
 *
 * ------------------------------------------------------------------
 * UpdateBanner — DOM overlay shown when a new SW is waiting.
 *
 * Why a DOM banner and not a Pixi widget?
 *  - The Pixi stage might be destroyed/rebuilding during scene transitions.
 *  - The banner needs to live above everything, including the Pixi canvas.
 *  - HTML/CSS is the right tool for tiny one-shot UI like this.
 *
 * The banner has two states:
 *  - PROMPT: "Nova versão disponível. Atualizar agora?" — visible, dismissible.
 *  - QUEUED: shown when the user accepted but we're waiting for a safe scene.
 *    "Atualização aplica ao voltar ao hub." — informational, non-interactive.
 *
 * The banner respects pointer-events on its container only (matches
 * #ui-overlay pattern from index.html) so it never blocks game input.
 */

export type UpdateBannerCallbacks = {
  onAccept: () => void;
  onDismiss: () => void;
};

export class UpdateBanner {
  private readonly root: HTMLDivElement;
  private readonly card: HTMLDivElement;
  private readonly title: HTMLDivElement;
  private readonly msg: HTMLDivElement;
  private readonly btnAccept: HTMLButtonElement;
  private readonly btnDismiss: HTMLButtonElement;

  constructor(private readonly cb: UpdateBannerCallbacks) {
    this.root = document.createElement('div');
    this.root.id = 'pwa-update-banner';
    this.root.setAttribute('role', 'status');
    this.root.setAttribute('aria-live', 'polite');
    this.applyRootStyle();

    this.card = document.createElement('div');
    this.applyCardStyle();
    this.root.appendChild(this.card);

    this.title = document.createElement('div');
    this.title.textContent = 'Nova versão disponível';
    this.applyTitleStyle();
    this.card.appendChild(this.title);

    this.msg = document.createElement('div');
    this.msg.textContent = 'Atualize para receber os fixes mais recentes.';
    this.applyMsgStyle();
    this.card.appendChild(this.msg);

    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.gap = '8px';
    row.style.marginTop = '10px';
    this.card.appendChild(row);

    this.btnDismiss = document.createElement('button');
    this.btnDismiss.type = 'button';
    this.btnDismiss.textContent = 'Mais tarde';
    this.applyBtnStyle(this.btnDismiss, false);
    this.btnDismiss.addEventListener('click', () => this.cb.onDismiss());
    row.appendChild(this.btnDismiss);

    this.btnAccept = document.createElement('button');
    this.btnAccept.type = 'button';
    this.btnAccept.textContent = 'Atualizar';
    this.applyBtnStyle(this.btnAccept, true);
    this.btnAccept.addEventListener('click', () => this.cb.onAccept());
    row.appendChild(this.btnAccept);
  }

  mount(): void {
    // We attach to #ui-overlay if it exists (matches the game's overlay
    // convention from index.html); fallback to body.
    const host = document.getElementById('ui-overlay') ?? document.body;
    if (!this.root.isConnected) host.appendChild(this.root);
  }

  unmount(): void {
    this.root.remove();
  }

  /** Called when update is offered AND user is in a safe scene. */
  showPrompt(): void {
    this.title.textContent = 'Nova versão disponível';
    this.msg.textContent = 'Atualize para receber os fixes mais recentes.';
    this.btnAccept.disabled = false;
    this.btnAccept.style.opacity = '1';
    this.btnAccept.style.cursor = 'pointer';
    this.btnDismiss.style.display = '';
    this.root.style.display = 'flex';
  }

  /** Called when update is offered but user is mid-gameplay. */
  showQueued(): void {
    this.title.textContent = 'Atualização preparada';
    this.msg.textContent = 'Será aplicada quando voltar ao hub.';
    this.btnAccept.disabled = true;
    this.btnAccept.style.opacity = '0.5';
    this.btnAccept.style.cursor = 'not-allowed';
    this.btnDismiss.style.display = 'none';
    this.root.style.display = 'flex';
  }

  /** Brief "applying..." state right before reload. */
  showApplying(): void {
    this.title.textContent = 'Aplicando atualização…';
    this.msg.textContent = '';
    this.btnAccept.disabled = true;
    this.btnDismiss.style.display = 'none';
  }

  hide(): void {
    this.root.style.display = 'none';
  }

  // ─── styles ──────────────────────────────────────────────────────────────

  private applyRootStyle(): void {
    Object.assign(this.root.style, {
      position: 'fixed',
      bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: '10000',
      pointerEvents: 'auto',
      display: 'none',
      maxWidth: 'min(420px, calc(100vw - 24px))',
    } as Partial<CSSStyleDeclaration>);
  }

  private applyCardStyle(): void {
    Object.assign(this.card.style, {
      background: 'rgba(10, 10, 20, 0.92)',
      color: '#e6e6e6',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: '10px',
      padding: '12px 14px',
      fontFamily: '"Rubik", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      fontSize: '14px',
      lineHeight: '1.35',
      boxShadow: '0 6px 24px rgba(0, 0, 0, 0.45)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
    } as Partial<CSSStyleDeclaration>);
  }

  private applyTitleStyle(): void {
    Object.assign(this.title.style, {
      fontWeight: '600',
      letterSpacing: '0.02em',
      marginBottom: '4px',
    } as Partial<CSSStyleDeclaration>);
  }

  private applyMsgStyle(): void {
    Object.assign(this.msg.style, {
      opacity: '0.85',
      fontSize: '13px',
    } as Partial<CSSStyleDeclaration>);
  }

  private applyBtnStyle(btn: HTMLButtonElement, primary: boolean): void {
    Object.assign(btn.style, {
      flex: '1',
      padding: '8px 12px',
      borderRadius: '6px',
      border: primary ? 'none' : '1px solid rgba(255,255,255,0.18)',
      background: primary ? '#5b8def' : 'transparent',
      color: primary ? '#0a0a14' : '#e6e6e6',
      fontFamily: 'inherit',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      touchAction: 'manipulation',
    } as Partial<CSSStyleDeclaration>);
  }
}
