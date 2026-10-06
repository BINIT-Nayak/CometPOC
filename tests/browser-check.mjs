// Start the demo and Chrome with --remote-debugging-port=9223 before running.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const WebSocket = require('ws');
const tabs = await (await fetch('http://127.0.0.1:9223/json/list')).json();
const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(r => ws.once('open', r));
let id = 0; const pending = new Map(); const errors = [];
ws.on('message', bytes => {
  const m = JSON.parse(bytes.toString());
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails);
  if (m.id) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(m.error) : p.resolve(m.result); }
});
const call = (method, params = {}) => new Promise((resolve, reject) => { const n = ++id; pending.set(n, { resolve, reject }); ws.send(JSON.stringify({ id: n, method, params })); });
const delay = ms => new Promise(r => setTimeout(r, ms));
const evaluate = async expression => {
  const result = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
await call('Runtime.enable'); await call('Page.enable');
await mkdir('previews', { recursive: true });
for (const mode of ['green', 'all', 'fade']) {
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1050, deviceScaleFactor: 1, mobile: false });
  await call('Page.navigate', { url: `http://127.0.0.1:4175/?snapshot=${mode}` });
  await delay(650);
  const shot = await call('Page.captureScreenshot', { format: 'png' });
  await writeFile(`previews/${mode}.png`, Buffer.from(shot.data, 'base64'));
}
await call('Page.navigate', { url: 'http://127.0.0.1:4175/' }); await delay(300);
const lifecycle = await evaluate(`(async () => {
  document.querySelector('#loop').checked = false;
  const { engine } = window.cometDemo;
  document.querySelector('#burst').click();
  const simultaneous = engine.activeCount;
  await new Promise(r => setTimeout(r, 2300));
  const cleaned = engine.activeCount === 0;
  const empty = !engine.ctx.getImageData(0, 0, engine.canvas.width, engine.canvas.height).data.some(v => v !== 0);
  document.querySelector('#replay').click();
  const restarted = engine.activeCount === 1;
  return { simultaneous, cleaned, empty, restarted };
})()`);
assert.ok(lifecycle.simultaneous >= 4);
assert.ok(lifecycle.cleaned && lifecycle.empty && lifecycle.restarted);
console.log('browser', lifecycle);
await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await delay(250);
const mobile = await evaluate(`(() => {
  const e = window.cometDemo.engine, r = e.canvas.getBoundingClientRect();
  return { dpr: devicePixelRatio, width: r.width, backingWidth: e.canvas.width, correct: e.canvas.width === Math.round(r.width * 2), overflow: document.documentElement.scrollWidth > innerWidth };
})()`);
assert.ok(mobile.correct && !mobile.overflow);
console.log('retina/mobile', mobile);
await call('Page.captureScreenshot', { format: 'png' }).then(s => writeFile('previews/mobile.png', Buffer.from(s.data, 'base64')));
assert.ok(await evaluate(`(() => { const e = window.cometDemo.engine; e.destroy(); e.destroy(); try { e.launch({from:{x:0,y:0},to:{x:10,y:10}}); return false; } catch { return e.activeCount === 0; } })()`));
console.log('runtime errors', errors);
ws.close();
if (errors.length) process.exitCode = 1;
