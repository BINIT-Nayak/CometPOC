import type { Comet } from './Comet.js';
interface Surface { ctx: CanvasRenderingContext2D; width: number; height: number; comets: Comet[] }
/** One RAF across all engines, including engines on different canvases. */
export class AnimationManager {
  private static surfaces = new Set<Surface>();
  private static frame: number | null = null;
  static wake(surface: Surface): void {
    this.surfaces.add(surface);
    if (this.frame === null) this.frame = requestAnimationFrame(this.tick);
  }
  static remove(surface: Surface): void {
    this.surfaces.delete(surface);
    if (!this.surfaces.size && this.frame !== null) {
      cancelAnimationFrame(this.frame); this.frame = null;
    }
  }
  private static tick = (time: number): void => {
    this.frame = null;
    for (const surface of this.surfaces) {
      const { ctx, comets } = surface;
      ctx.clearRect(0, 0, surface.width, surface.height);
      let alive = 0;
      for (const comet of comets) {
        comet.update(time);
        if (comet.state !== 'dead') { comet.draw(ctx); comets[alive++] = comet; }
      }
      comets.length = alive;
      if (!alive) this.surfaces.delete(surface);
    }
    if (this.surfaces.size) this.frame = requestAnimationFrame(this.tick);
  };
}
