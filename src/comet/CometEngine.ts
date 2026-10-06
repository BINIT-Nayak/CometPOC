import { AnimationManager } from './AnimationManager.js';
import { Comet } from './Comet.js';
import { easing } from './easing.js';
import { parseHex } from './color.js';
import type { CometLaunchOptions, CometOptions } from './types.js';
export type { CometLaunchOptions, Point, EasingName } from './types.js';
export const defaults = { color: '#49ff78', headSize: 6, trailLength: 100,
  curve: 0.18, duration: 900, particleCount: 12, easing: 'easeOutCubic' } as const;
export class CometEngine {
  readonly ctx: CanvasRenderingContext2D;
  readonly comets: Comet[] = [];
  width = 0;
  height = 0;
  private destroyed = false;
  private observer: ResizeObserver;
  private dprQuery: MediaQueryList | undefined;
  constructor(readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is unavailable');
    this.ctx = ctx;
    this.resize();
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
    this.watchDpr();
  }
  private watchDpr = (): void => {
    this.dprQuery?.removeEventListener('change', this.watchDpr);
    this.resize();
    this.dprQuery = matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
    this.dprQuery.addEventListener('change', this.watchDpr);
  };
  /** Size the canvas with CSS. All public positions are relative to its top-left in CSS pixels. */
  resize(): void {
    if (this.destroyed) return;
    const rect = this.canvas.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    this.width = rect.width; this.height = rect.height;
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  launch(options: CometLaunchOptions): void {
    if (this.destroyed) throw new Error('Cannot launch after destroy()');
    const o: CometOptions = { ...defaults, ...options, from: { ...options.from }, to: { ...options.to } };
    for (const value of [o.from.x, o.from.y, o.to.x, o.to.y, o.headSize, o.trailLength, o.curve, o.duration, o.particleCount]) {
      if (!Number.isFinite(value)) throw new TypeError('Comet numeric options must be finite');
    }
    if (o.duration <= 0 || o.headSize <= 0 || o.trailLength < 0 || o.particleCount < 0 || o.particleCount > 1000) {
      throw new RangeError('Use positive duration/headSize, nonnegative trailLength and particleCount from 0 to 1000');
    }
    if (!Object.hasOwn(easing, o.easing)) throw new TypeError('Unknown easing');
    parseHex(o.color);
    this.comets.push(new Comet(o, performance.now()));
    AnimationManager.wake(this);
  }
  get activeCount(): number { return this.comets.length; }
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    AnimationManager.remove(this); this.observer.disconnect();
    this.dprQuery?.removeEventListener('change', this.watchDpr);
    this.comets.length = 0; this.ctx.clearRect(0, 0, this.width, this.height);
  }
}
