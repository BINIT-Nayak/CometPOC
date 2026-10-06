import type { CometOptions, Point, RGB, TrailPoint } from './types.js';
import { parseHex } from './color.js';
import { bezier, clamp, Trajectory } from './math.js';
import { easing } from './easing.js';
import { ParticleSystem } from './particles/ParticleSystem.js';
import { drawTrail } from './renderers/TrailRenderer.js';
import { drawGlow } from './renderers/GlowRenderer.js';

export const TAIL_FADE_MS = 480;
export class Comet {
  readonly trajectory: Trajectory;
  readonly particles = new ParticleSystem();
  readonly color: RGB;
  readonly trail: TrailPoint[] = [];
  position: Point;
  progress = 0;
  state: 'travelling' | 'fading' | 'dead' = 'travelling';
  private time: number;
  private nextEmission: number;
  private fade = 1;
  constructor(readonly options: CometOptions, readonly startTime: number) {
    this.trajectory = new Trajectory(options.from, options.to, options.curve);
    this.position = { ...options.from };
    this.color = parseHex(options.color);
    this.time = startTime;
    this.nextEmission = startTime;
  }
  private positionAt(time: number): Point {
    const t = easing[this.options.easing](clamp((time - this.startTime) / this.options.duration));
    return bezier(this.options.from, this.trajectory.control, this.options.to, t);
  }
  update(time: number): void {
    this.time = time;
    const o = this.options;
    this.progress = clamp((time - this.startTime) / o.duration);
    const arrived = this.startTime + o.duration;
    this.fade = 1 - clamp((time - arrived) / TAIL_FADE_MS);
    this.state = this.progress < 1 ? 'travelling' : 'fading';
    this.position = this.positionAt(time);
    const distance = this.trajectory.distanceAt(easing[o.easing](this.progress));
    const length = Math.min(distance, o.trailLength) * this.fade;
    // Recover the exact traversed history even when a frame is skipped; never bridge a curve with a chord.
    const samples = length > 0 ? Math.max(1, Math.min(2048, Math.ceil(length / 2))) : 0;
    for (let i = 0; i <= samples; i++) {
      const d = distance - length + (samples ? length * i / samples : 0);
      const p = this.trajectory.atDistance(d);
      if (this.trail[i]) Object.assign(this.trail[i], p, { distance: d });
      else this.trail[i] = { ...p, distance: d };
    }
    this.trail.length = samples + 1;
    if (o.particleCount > 0) {
      const interval = 500 / o.particleCount;
      // A suspended tab must not emit seconds of old sparks on resume.
      this.nextEmission = Math.max(this.nextEmission, time - 680);
      while (this.nextEmission < Math.min(time, arrived)) {
        const p = this.positionAt(this.nextEmission), before = this.positionAt(this.nextEmission - 2);
        const dx = p.x - before.x, dy = p.y - before.y, norm = Math.hypot(dx, dy);
        if (norm > 0.0001) this.particles.emit(p, { x: dx / norm, y: dy / norm }, this.nextEmission, o.headSize);
        this.nextEmission += interval;
      }
    }
    this.particles.update(time);
    if (this.progress === 1 && this.fade === 0 && this.particles.particles.length === 0) this.state = 'dead';
  }
  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    drawTrail(ctx, this.trail, this.options.headSize, this.color, this.fade ** 1.5);
    this.particles.draw(ctx, this.color, this.time);
    if (this.state === 'travelling') {
      const appear = clamp((this.time - this.startTime) / 70);
      drawGlow(ctx, this.position, this.options.headSize, this.color, appear);
    }
    ctx.restore();
  }
}
