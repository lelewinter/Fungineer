import { Container } from 'pixi.js';
import type { App } from './App';

/** Base scene — analogue of a Godot root Node2D. */
export abstract class Scene {
  readonly root: Container = new Container();
  protected app!: App;

  /** Called by SceneManager once after creation, before enter. */
  bind(app: App): void {
    this.app = app;
  }

  /** Override to build child nodes. Called when scene becomes active. */
  abstract enter(): Promise<void> | void;

  /** Per-frame update. Delta is in seconds (Pixi Ticker uses ms). */
  update(_dt: number): void {}

  /** Override to release listeners / external state. Container teardown is automatic. */
  exit(): Promise<void> | void {}
}
