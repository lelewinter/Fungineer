export type SignalListener<T extends unknown[]> = (...args: T) => void;

/** Lightweight Godot-style typed signal. */
export class Signal<T extends unknown[] = []> {
  private listeners: Array<SignalListener<T>> = [];
  private emitting = false;

  connect(fn: SignalListener<T>): () => void {
    this.listeners.push(fn);
    return () => this.disconnect(fn);
  }

  disconnect(fn: SignalListener<T>): void {
    const idx = this.listeners.indexOf(fn);
    if (idx !== -1) this.listeners.splice(idx, 1);
  }

  emit(...args: T): void {
    if (this.emitting) {
      // Re-entrant emit: copy only in this rare case
      for (const l of this.listeners.slice()) l(...args);
      return;
    }
    this.emitting = true;
    for (let i = 0; i < this.listeners.length; i++) {
      this.listeners[i]!(...args);
    }
    this.emitting = false;
  }

  clear(): void {
    this.listeners = [];
  }
}
