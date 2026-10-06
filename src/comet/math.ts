import type { Point } from './types.js';
export const clamp = (n: number, lo = 0, hi = 1): number => Math.max(lo, Math.min(hi, n));
export function controlPoint(a: Point, b: Point, curve: number): Point {
  return { x: (a.x + b.x) / 2 - (b.y - a.y) * curve, y: (a.y + b.y) / 2 + (b.x - a.x) * curve };
}
export function bezier(a: Point, c: Point, b: Point, t: number): Point {
  const u = 1 - t;
  return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
    y: u * u * a.y + 2 * u * t * c.y + t * t * b.y };
}
/** Arc-length lookup: fixed CSS-distance sampling, independent of frame rate. */
export class Trajectory {
  readonly points: Array<Point & { distance: number }> = [];
  readonly control: Point;
  readonly length: number;
  constructor(readonly from: Point, readonly to: Point, curve: number) {
    this.control = controlPoint(from, to, curve);
    const bound = Math.hypot(this.control.x - from.x, this.control.y - from.y)
      + Math.hypot(to.x - this.control.x, to.y - this.control.y);
    const steps = Math.max(1, Math.min(8192, Math.ceil(bound / 1.5)));
    let length = 0;
    let last = from;
    for (let i = 0; i <= steps; i++) {
      const p = bezier(from, this.control, to, i / steps);
      length += Math.hypot(p.x - last.x, p.y - last.y);
      this.points.push({ ...p, distance: length });
      last = p;
    }
    this.length = length;
  }
  distanceAt(t: number): number {
    const index = clamp(t) * (this.points.length - 1);
    const i = Math.floor(index), j = Math.min(i + 1, this.points.length - 1);
    return this.points[i].distance + (this.points[j].distance - this.points[i].distance) * (index - i);
  }
  atDistance(distance: number): Point {
    const d = clamp(distance, 0, this.length);
    let lo = 0, hi = this.points.length - 1;
    while (lo + 1 < hi) {
      const mid = (lo + hi) >> 1;
      if (this.points[mid].distance < d) lo = mid; else hi = mid;
    }
    const a = this.points[lo], b = this.points[hi];
    const f = (d - a.distance) / (b.distance - a.distance || 1);
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
  }
}
