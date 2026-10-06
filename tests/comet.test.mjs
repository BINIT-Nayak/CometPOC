import test from 'node:test';
import assert from 'node:assert/strict';
import { Comet } from '../dist/comet/Comet.js';
import { defaults } from '../dist/comet/CometEngine.js';
import { Trajectory } from '../dist/comet/math.js';
import { AnimationManager } from '../dist/comet/AnimationManager.js';

const options = { ...defaults, from: { x: 0, y: 300 }, to: { x: 900, y: 0 }, particleCount: 0, duration: 1000, trailLength: 80 };
test('trail measures 80 CSS pixels independent of update rate', () => {
  for (const fps of [15, 30, 60, 120]) {
    const comet = new Comet(options, 0);
    for (let t = 0; t < 600; t += 1000 / fps) comet.update(t);
    comet.update(600);
    const length = comet.trail.at(-1).distance - comet.trail[0].distance;
    assert.ok(Math.abs(length - 80) < 0.01);
    assert.ok(Math.hypot(comet.position.x - comet.trail.at(-1).x, comet.position.y - comet.trail.at(-1).y) < 0.01);
  }
});
test('destination removes head, keeps fading tail, then becomes dead', () => {
  const comet = new Comet(options, 0);
  comet.update(1000);
  assert.equal(comet.state, 'fading');
  assert.deepEqual(comet.position, options.to);
  assert.ok(comet.trail.length > 1);
  comet.update(1240);
  assert.equal(comet.trail.at(-1).distance - comet.trail[0].distance, 40);
  comet.update(1700);
  assert.equal(comet.state, 'dead');
});
test('zero-length paths and zero trails stay finite', () => {
  const comet = new Comet({ ...options, to: options.from, trailLength: 0 }, 0);
  comet.update(500);
  assert.deepEqual(comet.position, options.from);
  assert.equal(comet.trail.length, 1);
});
test('curve sign changes bend and straight trajectory stays straight', () => {
  const a = { x: 0, y: 0 }, b = { x: 100, y: 0 };
  assert.equal(new Trajectory(a, b, 0).length, 100);
  assert.ok(new Trajectory(a, b, .5).atDistance(50).y > 0);
  assert.ok(new Trajectory(a, b, -.5).atDistance(50).y < 0);
});
test('particles finish after skipped frames without a catch-up explosion', () => {
  const comet = new Comet({ ...options, particleCount: 14 }, 0);
  comet.update(500);
  assert.ok(comet.particles.particles.length > 0);
  assert.ok(comet.particles.particles.length < 30);
  comet.update(60000);
  assert.equal(comet.state, 'dead');
  assert.equal(comet.particles.particles.length, 0);
});
test('one RAF serves two canvases, stops at idle and restarts', () => {
  const callbacks = new Map(); let id = 0;
  globalThis.requestAnimationFrame = fn => { callbacks.set(++id, fn); return id; };
  globalThis.cancelAnimationFrame = n => callbacks.delete(n);
  const surface = () => ({ width: 100, height: 100, ctx: { clearRect() {} }, comets: [{ state: 'travelling', update() { this.state = 'dead'; }, draw() {} }] });
  const a = surface(), b = surface();
  AnimationManager.wake(a); AnimationManager.wake(b);
  assert.equal(callbacks.size, 1);
  const fn = [...callbacks.values()][0]; callbacks.clear(); fn(2000);
  assert.equal(callbacks.size, 0);
  assert.equal(a.comets.length + b.comets.length, 0);
  AnimationManager.wake(a);
  assert.equal(callbacks.size, 1);
  AnimationManager.remove(a);
  assert.equal(callbacks.size, 0);
});
