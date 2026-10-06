import type { Particle } from './Particle.js';
import type { Point, RGB } from '../types.js';
import { drawGlow } from '../renderers/GlowRenderer.js';
export class ParticleSystem {
  readonly particles: Particle[] = [];
  emit(p: Point, direction: Point, time: number, size: number): void {
    const back = 14 + Math.random() * 28, scatter = (Math.random() - 0.5) * 28;
    const offset = (Math.random() - 0.5) * size;
    this.particles.push({ x: p.x - direction.y * offset, y: p.y + direction.x * offset,
      vx: -direction.x * back - direction.y * scatter,
      vy: -direction.y * back + direction.x * scatter,
      born: time, life: 320 + Math.random() * 360,
      size: size * (0.09 + Math.random() * 0.13), opacity: 0.4 + Math.random() * 0.5 });
  }
  update(time: number): void {
    let alive = 0;
    for (const p of this.particles) if (time - p.born < p.life) this.particles[alive++] = p;
    this.particles.length = alive;
  }
  draw(ctx: CanvasRenderingContext2D, color: RGB, time: number): void {
    for (const p of this.particles) {
      const age = Math.max(0, time - p.born), t = age / 1000;
      drawGlow(ctx, { x: p.x + p.vx * t, y: p.y + p.vy * t }, p.size, color,
        p.opacity * (1 - age / p.life) ** 1.8);
    }
  }
}
