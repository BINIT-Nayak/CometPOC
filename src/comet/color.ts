import type { RGB } from './types.js';
export function parseHex(hex: string): RGB {
  if (!/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(hex)) throw new TypeError('color must be #RGB or #RRGGBB');
  const value = hex.length === 4 ? hex.slice(1).split('').map(c => c + c).join('') : hex.slice(1);
  const n = Number.parseInt(value, 16);
  return { r: n >> 16, g: (n >> 8) & 255, b: n & 255 };
}
export const rgba = (c: RGB, a: number): string => `rgba(${c.r},${c.g},${c.b},${a})`;
export const whiten = (c: RGB, mix = 0.85): RGB => ({
  r: Math.round(c.r + (255 - c.r) * mix),
  g: Math.round(c.g + (255 - c.g) * mix),
  b: Math.round(c.b + (255 - c.b) * mix),
});
