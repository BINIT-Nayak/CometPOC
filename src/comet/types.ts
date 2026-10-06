export interface Point { x: number; y: number }
export type EasingName = 'linear' | 'easeInCubic' | 'easeOutCubic' | 'easeInOutCubic';
export interface CometLaunchOptions {
  from: Point; to: Point; color?: string; headSize?: number;
  trailLength?: number; curve?: number; duration?: number;
  /** Approximate number of sparks alive at steady state. Zero disables sparks. */
  particleCount?: number; easing?: EasingName;
}
export type CometOptions = Required<CometLaunchOptions>;
export interface TrailPoint extends Point { distance: number }
export interface RGB { r: number; g: number; b: number }
