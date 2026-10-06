import { rgba, whiten } from '../color.js';
import type { RGB, TrailPoint } from '../types.js';
/** Continuous tapered ribbons avoid the beads/joins produced by per-segment strokes. */
export function drawTrail(ctx: CanvasRenderingContext2D, points: TrailPoint[], size: number, color: RGB, alpha: number): void {
  if (points.length < 2) return;
  const last = points.length - 1;
  const start = points[0], end = points[last];
  const span = end.distance - start.distance || 1;
  const layers = [
    { width: 1.35, opacity: 0.13, blur: size * 2.3, color },
    { width: 0.56, opacity: 0.35, blur: size * 0.65, color },
    { width: 0.14, opacity: 0.9, blur: 0, color: whiten(color, 0.65) },
  ];
  for (const layer of layers) {
    const gradient = ctx.createLinearGradient(start.x, start.y, end.x + 0.001, end.y);
    gradient.addColorStop(0, rgba(layer.color, 0));
    gradient.addColorStop(0.3, rgba(layer.color, 0.12 * alpha * layer.opacity));
    gradient.addColorStop(0.7, rgba(layer.color, 0.6 * alpha * layer.opacity));
    gradient.addColorStop(1, rgba(layer.color, alpha * layer.opacity));
    ctx.fillStyle = gradient;
    ctx.shadowColor = rgba(color, alpha * 0.7); ctx.shadowBlur = layer.blur;
    ctx.beginPath();
    for (let side = 1; side >= -1; side -= 2) {
      for (let j = 0; j <= last; j++) {
        const i = side === 1 ? j : last - j;
        const p = points[i], before = points[Math.max(0, i - 1)], after = points[Math.min(last, i + 1)];
        const dx = after.x - before.x, dy = after.y - before.y, length = Math.hypot(dx, dy) || 1;
        const width = size * layer.width * ((p.distance - start.distance) / span) ** 1.25;
        const x = p.x - dy / length * width * side, y = p.y + dx / length * width * side;
        if (j === 0 && side === 1) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
    }
    ctx.closePath(); ctx.fill();
  }
  ctx.shadowBlur = 0;
}
