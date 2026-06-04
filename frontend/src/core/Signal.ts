export type SignalListener<T extends unknown[]> = (...args: T) => void;

/** Lightweight Godot-style typed signal. */
export class Signal<T extends unknown[] = []> {
  private listeners: Array<SignalListener<T>> = [];

  connect(fn: SignalListener<T>): () => void {
    this.listeners.push(fn);
    return () => this.disconnect(fn);
  }

  disconnect(fn: SignalListener<T>): void {
    this.listeners = this.listeners.filter((l) => l !== fn);
  }

  emit(...args: T): void {
    for (const l of this.listeners.slice()) l(...args);
  }

  clear(): void {
    this.listeners = [];
  }
}
