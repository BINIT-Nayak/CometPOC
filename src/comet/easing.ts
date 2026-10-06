import type { EasingName } from './types.js';
export const easing: Record<EasingName, (t: number) => number> = {
  linear: t => t,
  easeInCubic: t => t * t * t,
  easeOutCubic: t => 1 - (1 - t) ** 3,
  easeInOutCubic: t => t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2,
};
