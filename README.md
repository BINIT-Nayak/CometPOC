# Magic comet — first working version

Deployed: https://cheerful-platypus-ddcaa2.netlify.app/

A procedural Canvas 2D + TypeScript effect. The supplied image was used only as a visual reference. No sprite assets, pixel sampling, external fonts, animation libraries, or WebGL are used.

## Run

Requires Node.js 20+ and Python 3.

```sh
npm install
npm run dev
```

Open http://127.0.0.1:4175. The demo has four color/trajectory presets, simultaneous launches, click-to-aim, replay, and trail/duration controls. Rebuild after editing TypeScript with `npm run build`; no watcher is included in this prototype.

Captured browser previews are in `previews/green.png`, `previews/all.png`, and `previews/fade.png`. `?snapshot=green`, `?snapshot=all`, and `?snapshot=fade` render paused simulations with the same renderer; particles remain randomized.

## Public usage

```ts
import { CometEngine } from './comet/CometEngine.js';

const engine = new CometEngine(canvas);
engine.launch({
  from: { x: 120, y: 700 },
  to: { x: 720, y: 180 },
  color: '#49ff78',
  headSize: 6,
  trailLength: 80,
  curve: 0.18,
  duration: 900,
  particleCount: 12,
  easing: 'easeOutCubic',
});

// Repeat launch() for overlapping instances.
// On component unmount:
engine.destroy();
```

Use `src/comet` directly in a TypeScript frontend, or import the built `dist/comet/CometEngine.js` in a browser. `.js` imports inside TypeScript deliberately support native ES modules after compilation.

The canvas must have an explicit CSS size. A full-screen UI overlay can use:

```css
.comet-overlay {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 100;
}
```

Coordinates are CSS pixels relative to the canvas top-left. For a fixed viewport overlay, these match `clientX/clientY`. For an embedded canvas, subtract its bounding rectangle. Use one engine per canvas; the engine owns and clears that canvas. CSS controls layout; ResizeObserver and a DPR media query update the backing store. `resize()` is also available explicitly. Existing trajectories keep their original coordinates after a resize.

## Architecture

- `CometEngine.ts`: public API, validated/copy-on-launch options, DPR sizing and teardown.
- `AnimationManager.ts`: one static RAF across engines/canvases, compaction of completed comets, automatic idle stop and restart.
- `Comet.ts`: eased Bézier movement, distance-based trail samples, travelling → fading → dead lifecycle.
- `math.ts`: quadratic curve and arc-length lookup. The traversed portion is sampled at approximately 2 CSS pixel spacing; its oldest distance is trimmed to `trailLength`. Reconstructing history from the known curve prevents visible shortcuts after a skipped frame.
- `renderers`: continuous tapered ribbons with three glow/core layers, plus radial-gradient heads. No per-segment stroke joins.
- `particles`: time-based emission, backward velocity with perpendicular scatter, individual lifetime/size/opacity and smooth fade.
- `types.ts`, `easing.ts`, `color.ts`: shared types, four easing functions and HEX-derived colors.

## Visual tuning

Start with launch options: `headSize`, `trailLength`, `curve`, `duration`, and `particleCount`. Defaults are 6 px, 100 px, 0.18, 900 ms and 12. The demo uses slower ease-in-out motion to make inspection easier; the engine defaults to ease-out cubic.

- `Comet.ts`: `TAIL_FADE_MS = 480`, fade exponent 1.5, appearance ramp 70 ms. The head disappears at arrival; the remaining trail shrinks toward the destination while fading, and sparks finish independently.
- `TrailRenderer.ts`: layer width/opacity/blur and taper exponent 1.25.
- `GlowRenderer.ts`: bloom radius multiplier 4 and gradient stops.
- `ParticleSystem.ts`: lifetime 320–680 ms, backward speed 14–42 px/s, scatter, size and opacity.

`trailLength` is the geometric extent in CSS pixels; its faintest end may be visually imperceptible. `particleCount` means approximate simultaneous spark density, not a fixed total emission count. Zero disables particles. Colors support `#RGB` and `#RRGGBB`. Numeric options must be finite; duration/head size must be positive, trail length nonnegative, and particle count between 0 and 1000. Caller options and endpoints are copied.

## Verification and limits

`npm test` builds TypeScript and checks trail distance at 15/30/60/120 FPS, destination fade and cleanup, zero-length paths, curve signs, suspended-tab particle cleanup, and one shared RAF stopping/restarting across two canvases.

Browser verification: start the local demo, run Chrome with `--headless --remote-debugging-port=9223` using a separate user-data directory, then `npm run test:browser`. This captures previews and asserts simultaneous comets, an empty canvas after completion, replay, resize to a mobile viewport at DPR 2, and destroy behavior. It requires a local Chrome debugging endpoint; it is not part of the default unit test command.

The first version was checked in desktop Chrome and emulated mobile/DPR 2, not on physical mobile devices or Safari/Firefox. It is not a production performance benchmark. There are no runtime dependencies or per-frame React updates. Completed objects are removed and no RAF runs when idle. The demo's replay timer is separate from the engine and is cleared on page exit.

Trail buffers reuse point objects; trajectories and trail samples are bounded. Gradient creation and Canvas shadows still cost CPU/GPU time, particularly with many large comets at high DPR. Particle density is bounded and emission skips expired history after tab suspension. Heavy scenes should be profiled before adding pooling or glow caches. Multiple bundled copies of the module have separate schedulers; sharing one module instance provides the global RAF guarantee.
