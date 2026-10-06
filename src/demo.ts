import { CometEngine, defaults } from './comet/CometEngine.js';
import { Comet } from './comet/Comet.js';
import type { CometLaunchOptions } from './comet/types.js';
const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
const stage = document.querySelector<HTMLElement>('#stage')!;
const engine = new CometEngine(canvas);
const trail = document.querySelector<HTMLInputElement>('#trail')!;
const duration = document.querySelector<HTMLInputElement>('#duration')!;
const loop = document.querySelector<HTMLInputElement>('#loop')!;
let selected = 'green';
const names: Record<string, string> = { green: '01 / EMERALD', blue: '02 / GLACIER', purple: '03 / AMETHYST', gold: '04 / GOLD DUST' };
function options(name: string): CometLaunchOptions {
  const w = engine.width, h = engine.height;
  const common = { trailLength: Number(trail.value), duration: Number(duration.value), easing: 'easeInOutCubic' as const };
  const presets: Record<string, CometLaunchOptions> = {
    green: { from: { x: w * .12, y: h * .77 }, to: { x: w * .85, y: h * .22 }, color: '#49ff78', curve: -.18, headSize: 5, particleCount: 14 },
    blue: { from: { x: w * .88, y: h * .35 }, to: { x: w * .13, y: h * .65 }, color: '#56baff', curve: .16, headSize: 5, particleCount: 13 },
    purple: { from: { x: w * .18, y: h * .78 }, to: { x: w * .83, y: h * .27 }, color: '#c58aff', curve: -.55, headSize: 8, particleCount: 18 },
    gold: { from: { x: w * .22, y: h * .73 }, to: { x: w * .8, y: h * .32 }, color: '#ffcf68', curve: .24, headSize: 3, particleCount: 10 },
  };
  return { ...presets[name], ...common };
}
function launch(name = selected): void { engine.launch(options(name)); }
document.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach(button => button.addEventListener('click', () => {
  selected = button.dataset.preset!;
  document.querySelectorAll('[data-preset]').forEach(b => b.classList.toggle('selected', b === button));
  document.querySelector('#stage-caption')!.textContent = names[selected]; launch();
}));
document.querySelector('#replay')!.addEventListener('click', () => launch());
document.querySelector('#burst')!.addEventListener('click', () => Object.keys(names).forEach(name => launch(name)));
stage.addEventListener('click', event => {
  const rect = canvas.getBoundingClientRect();
  engine.launch({ ...options(selected), to: { x: event.clientX - rect.left, y: event.clientY - rect.top } });
});
trail.addEventListener('input', () => document.querySelector('#trail-value')!.textContent = `${trail.value} px`);
duration.addEventListener('input', () => document.querySelector('#duration-value')!.textContent = `${(Number(duration.value) / 1000).toFixed(1)} s`);
const snapshot = new URLSearchParams(location.search).get('snapshot');
let timer: ReturnType<typeof setInterval> | undefined;
if (snapshot) {
  loop.checked = false;
  // Reproducible stills use the real simulation and renderers, with no image assets.
  const paint = (): void => {
    engine.ctx.clearRect(0, 0, engine.width, engine.height);
    const all = snapshot === 'all';
    const list = all ? Object.keys(names) : ['green'];
    list.forEach((name, i) => {
      const comet = new Comet({ ...defaults, ...options(name) }, 0);
      const end = snapshot === 'fade' ? 1600 : 750 + (all ? i * 45 : 0);
      for (let time = 0; time <= end; time += 1000 / 60) comet.update(time);
      comet.draw(engine.ctx);
    });
    document.querySelector('#mode-label')!.textContent = 'Paused simulation · visual preview';
  };
  setTimeout(paint, 150);
} else {
  launch();
  timer = setInterval(() => { if (loop.checked && !document.hidden && engine.activeCount === 0) launch(); }, 700);
}
window.addEventListener('pagehide', () => { clearInterval(timer); engine.destroy(); });
// Read-only access is useful for checking lifecycle and DPR from browser devtools.
Object.assign(window, { cometDemo: { engine, launch } });
