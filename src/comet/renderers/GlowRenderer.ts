import { rgba, whiten } from '../color.js';
import type { Point, RGB } from '../types.js';
export function drawGlow(ctx: CanvasRenderingContext2D, p: Point, size: number, color: RGB, alpha = 1): void {
  const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 4);
  gradient.addColorStop(0, rgba(whiten(color), alpha));
  gradient.addColorStop(0.09, rgba(whiten(color, 0.7), alpha));
  gradient.addColorStop(0.2, rgba(color, alpha * 0.85));
  gradient.addColorStop(0.42, rgba(color, alpha * 0.22));
  gradient.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = gradient;
  ctx.beginPath(); ctx.arc(p.x, p.y, size * 4, 0, Math.PI * 2); ctx.fill();
}
