#!/usr/bin/env node
import { createReadStream, existsSync, rmSync, statSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
const root = path.resolve(new URL('..', import.meta.url).pathname);
const chromePath = process.env.CHROME_BIN || '/usr/bin/google-chrome';
function serveRepo() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    const filePath = path.join(root, url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname));
    if (!filePath.startsWith(root) || !existsSync(filePath) || statSync(filePath).isDirectory()) {
      res.writeHead(404); res.end('not found'); return;
    }
    const type = filePath.endsWith('.js') ? 'text/javascript' : filePath.endsWith('.css') ? 'text/css' : filePath.endsWith('.json') ? 'application/json' : 'text/html';
    res.writeHead(200, { 'content-type': `${type}; charset=utf-8`, 'cache-control': 'no-store' });
    createReadStream(filePath).pipe(res);
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
async function waitJson(url, timeoutMs = 8000) {
  const start = Date.now();
  let last;
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
      last = `${res.status} ${res.statusText}`;
    } catch (e) { last = e.message; }
    await delay(120);
  }
  throw new Error(`Timed out waiting for ${url}: ${last || 'no response'}`);
}
class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.events = [];
    this.ws.addEventListener('message', event => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        else resolve(msg.result);
      } else if (msg.method) {
        this.events.push(msg);
      }
    });
  }
  async open() {
    if (this.ws.readyState === WebSocket.OPEN) return;
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
  }
  send(method, params = {}) {
    const id = this.nextId++;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  close() { this.ws.close(); }
}
async function createPage(baseUrl, viewport) {
  const port = 9300 + Math.floor(Math.random() * 400);
  const profile = path.join(root, `.tmp-headless-chrome-${port}`);
  rmSync(profile, { recursive: true, force: true });
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--disable-background-networking',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    'about:blank',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  const version = await waitJson(`http://127.0.0.1:${port}/json/version`);
  const list = await waitJson(`http://127.0.0.1:${port}/json/list`);
  const target = list.find(t => t.type === 'page') || list[0];
  const cdp = new CDP(target.webSocketDebuggerUrl || version.webSocketDebuggerUrl);
  await cdp.open();
  await cdp.send('Runtime.enable');
  await cdp.send('Page.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', viewport);
  await cdp.send('Page.navigate', { url: `${baseUrl}/?remoteLb=0&headlessSim=${Date.now()}` });
  await evalPage(cdp, `new Promise(resolve => {
    const check = () => window.NS && window.G && window.Render && window.UIx ? resolve(true) : setTimeout(check, 40);
    check();
  })`, true);
  return { cdp, chrome, profile };
}
async function closePage(page) {
  try { page.cdp.close(); }
  catch (e) { console.warn(`CDP close failed during cleanup: ${e && e.message ? e.message : 'unknown error'}`); }
  if (page.chrome && !page.chrome.killed) {
    page.chrome.kill('SIGTERM');
    await Promise.race([
      new Promise(resolve => page.chrome.once('exit', resolve)),
      delay(1500),
    ]);
  }
  rmSync(page.profile, { recursive: true, force: true });
}
async function evalPage(cdp, expression, awaitPromise = false) {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise,
    returnByValue: true,
    userGesture: true,
  });
  if (result.exceptionDetails) {
    const detail = result.exceptionDetails.exception && result.exceptionDetails.exception.description
      ? result.exceptionDetails.exception.description
      : (result.exceptionDetails.text || 'Runtime.evaluate failed');
    throw new Error(detail);
  }
  return result.result.value;
}
const SIM_SOURCE = String.raw`
async function runScenario(opts) {
  const errors = [];
  addEventListener('error', e => errors.push(String(e.message || e.error || e)));
  addEventListener('unhandledrejection', e => errors.push(String(e.reason || e)));
  const G = window.G, R = window.Render, U = window.UIx;
  if (window.NS && NS.RNG && NS.RNG.setSeed) NS.RNG.setSeed(opts.seed || 20260625);
  G.start();
  G.test.manualClock = true;
  G.hurtPlayer = function() {};
  G.player.hp = 999999;
  G.userTimeScale = opts.userScale || 3;
  const bossEvents = [];
  const originalSpawnBoss = G.spawnBoss.bind(G);
  const originalSpawnMegaBoss = G.spawnMegaBoss.bind(G);
  G.spawnBoss = function(...args) {
    const boss = originalSpawnBoss(...args);
    if (boss) bossEvents.push({ t: +G.time.toFixed(1), kind: boss.bossKind || 'scheduled', affixes: boss.bossAffixes || [], name: boss.bossDef && boss.bossDef.name });
    return boss;
  };
  G.spawnMegaBoss = function(...args) {
    const boss = originalSpawnMegaBoss(...args);
    if (boss) bossEvents.push({ t: +G.time.toFixed(1), kind: 'mega', affixes: boss.bossAffixes || [], name: boss.bossDef && boss.bossDef.name, absorbed: boss.megaAbsorbedCount || 0 });
    return boss;
  };
  const frames = [];
  const spikes = [];
  for (let i = 0; i < (opts.maxFrames || 1800) && G.time < (opts.until || 1200); i++) {
    const s = performance.now();
    G.timeScale = opts.internalScale || 1;
    G.userTimeScale = opts.userScale || 1;
    G.player.hp = 999999;
    G.player.dead = false;
    G.update(opts.rdt || 0.035);
    if (opts.render !== false) R.draw();
    U.frame();
    const total = performance.now() - s;
    if (window.PerformanceBudget) PerformanceBudget.recordFrame(total);
    frames.push(total);
    if (total > 100) spikes.push({ frame: i, t: +G.time.toFixed(1), total: +total.toFixed(1), enemies: G.enemies.length, bosses: G.enemies.filter(e => e.boss).length, drops: G.drops.length, gems: G.gems.length, links: (G.bossLinks || []).length, debuffs: JSON.parse(JSON.stringify(G.bossDebuffs || {})) });
    if (i % 120 === 0) await new Promise(r => setTimeout(r, 0));
  }
  frames.sort((a,b)=>a-b);
  const pct = p => +frames[Math.min(frames.length - 1, Math.floor(frames.length * p))].toFixed(1);
  return { reached: G.time >= (opts.until || 1200), state: G.state, time: +G.time.toFixed(1), frames: frames.length, p95: pct(.95), p99: pct(.99), worst: +frames.at(-1).toFixed(1), slow100: frames.filter(v => v > 100).length, bossEvents: bossEvents.slice(-16), spikes: spikes.slice(0, 12), errors };
}
`;
const HALF_SPEED_SOURCE = String.raw`
async function measureHalfSpeed() {
  const G = window.G, R = window.Render, U = window.UIx;
  if (window.NS && NS.RNG && NS.RNG.setSeed) NS.RNG.setSeed(424242);
  G.start(); G.test.manualClock = true; G.hurtPlayer = function() {}; G.player.hp = 999999;
  while (G.time < 625) {
    G.userTimeScale = 3; G.timeScale = 8; G.player.hp = 999999; G.update(0.035);
    if ((G.frameSeq || 0) % 80 === 0) await new Promise(r => setTimeout(r, 0));
  }
  function sample(scale) {
    G.setUserTimeScale(scale);
    const visible = () => G.enemies.filter(e => !e.boss && R.worldVisible(e.x, e.y, 120)).slice(0, 80);
    let prev = new Map(visible().map(e => [e, { x: e.x, y: e.y }]));
    let frozenFrames = 0, maxFrozen = 0, movedFrames = 0, samples = 0, totalMove = 0;
    for (let i = 0; i < 360; i++) {
      G.timeScale = 1; G.userTimeScale = scale; G.player.hp = 999999; G.update(1 / 60); R.draw(); U.frame();
      let moved = 0, count = 0, dist = 0;
      for (const e of visible()) {
        const p = prev.get(e);
        if (!p) continue;
        const d = Math.hypot(e.x - p.x, e.y - p.y);
        dist += d; count++;
        if (d > 0.02) moved++;
      }
      samples += count; totalMove += dist;
      if (count > 12 && moved / count < 0.08) { frozenFrames++; maxFrozen = Math.max(maxFrozen, frozenFrames); }
      else { frozenFrames = 0; movedFrames++; }
      prev = new Map(visible().map(e => [e, { x: e.x, y: e.y }]));
    }
    return { scale, time: +G.time.toFixed(1), enemies: G.enemies.length, movedFrames, maxFrozen, avgMove: +(totalMove / Math.max(1, samples)).toFixed(4), state: G.state };
  }
  const one = sample(1);
  const half = sample(0.5);
  return { one, half, verdict: half.maxFrozen > Math.max(18, one.maxFrozen * 2) ? 'suspect-freeze' : 'movement-ok' };
}
`;

const INTERACTION_SMOKE_SOURCE = String.raw`
async function smokeBossInteractions() {
  const errors = [];
  addEventListener('error', e => errors.push(String(e.message || e.error || e)));
  addEventListener('unhandledrejection', e => errors.push(String(e.reason || e)));
  const G = window.G, R = window.Render, U = window.UIx;
  if (window.NS && NS.RNG && NS.RNG.setSeed) NS.RNG.setSeed(9091);
  G.start(); G.test.manualClock = true; G.hurtPlayer = function() {}; G.player.hp = 999999;
  while (G.time < 800) {
    G.timeScale = 8; G.userTimeScale = 3; G.player.hp = 999999; G.player.dead = false;
    G.update(0.035); R.draw(); U.frame();
    if ((G.frameSeq || 0) % 80 === 0) await new Promise(r => setTimeout(r, 0));
  }
  let boss = G.enemies.find(e => e.boss) || G.spawnMegaBoss(2) || G.spawnBoss(0);
  if (!boss) return { ok: false, reason: 'no-boss', errors };
  boss.x = G.player.x + 220; boss.y = G.player.y;
  boss.hp = Math.max(1, boss.maxHp - 1000);
  const beforeHp = boss.hp, beforeDrops = G.drops.length;
  G.drops.push({ kind: 'chicken', x: boss.x + 20, y: boss.y, stack: 1, t: 0, bob: 0 });
  G.gems.push({ x: boss.x + 26, y: boss.y, v: 3, t: 0 });
  G.startBossDropAbsorb(boss, 1.5);
  for (let i = 0; i < 10; i++) G.updateBossInteractions(0.1, G.st || G.stat());
  const absorb = { hpDelta: +(boss.hp - beforeHp).toFixed(1), dropsRemoved: beforeDrops + 1 - G.drops.length, absorbCount: boss.absorbCount || 0 };
  G.applyDropSeal(boss, 3);
  const dropSealActive = G.bossDebuffs && G.bossDebuffs.dropSealT > 0;
  while ((G.player.weapons || []).length < 8) {
    const id = Object.keys(WEAPONS || {}).find(key => !G.player.weapons.some(w => w.id === key));
    if (!id) break;
    G.player.weapons.push({ id, lv: 3, timer: 0.2 });
  }
  G.applyWeaponSilence(boss, 3);
  const silencedWeaponId = (G.bossDebuffs.weaponSeals || [])[0] && G.bossDebuffs.weaponSeals[0].id;
  const silencedWeapon = (G.player.weapons || []).find(w => w.id === silencedWeaponId);
  const silenceCheck = !!silencedWeapon && G.isWeaponSilenced(silencedWeapon);
  G.applyControlDistortion(boss, 'swirl', 3);
  const transformed = G.transformControlVector({ x: 1, y: 0 });
  const controlChanged = Math.abs(transformed.y) > 0.15 || Math.abs(transformed.x - 1) > 0.15;
  const ok = errors.length === 0 && absorb.hpDelta > 0 && absorb.dropsRemoved >= 1
    && dropSealActive && !!silencedWeaponId && silenceCheck && controlChanged;
  return { ok, time: +G.time.toFixed(1), state: G.state, absorb, dropSealActive, silencedWeaponId, silenceCheck,
    transformed: { x: +transformed.x.toFixed(3), y: +transformed.y.toFixed(3) }, links: (G.bossLinks || []).length, errors };
}
`;

async function main() {
  const server = await serveRepo();
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const cases = [
    { name: 'pc-24x', viewport: { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false }, opts: { userScale: 3, internalScale: 8, rdt: 0.035, until: 1200, maxFrames: 1800, render: true } },
    { name: 'mobile-24x', viewport: { width: 390, height: 844, deviceScaleFactor: 3, mobile: true }, opts: { userScale: 3, internalScale: 8, rdt: 0.035, until: 1200, maxFrames: 1800, render: true } },
  ];
  const output = {};
  try {
    for (const testCase of cases) {
      const page = await createPage(baseUrl, testCase.viewport);
      try {
        output[testCase.name] = await evalPage(page.cdp, `${SIM_SOURCE}; runScenario(${JSON.stringify({ ...testCase.opts, seed: 20260625 })})`, true);
      } finally {
        await closePage(page);
      }
    }
    const halfPage = await createPage(baseUrl, { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
    try {
      output['half-speed'] = await evalPage(halfPage.cdp, `${HALF_SPEED_SOURCE}; measureHalfSpeed()`, true);
    } finally {
      await closePage(halfPage);
    }
    const smokePage = await createPage(baseUrl, { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
    try {
      output['boss-interaction-smoke'] = await evalPage(smokePage.cdp, `${INTERACTION_SMOKE_SOURCE}; smokeBossInteractions()`, true);
    } finally {
      await closePage(smokePage);
    }
    console.log(JSON.stringify(output, null, 2));
    const perfWarnings = Object.entries(output)
      .filter(([name, result]) => name !== 'half-speed' && name !== 'boss-interaction-smoke' && result && (result.p99 > 35 || result.slow100 > 8))
      .map(([name, result]) => `${name}: p99=${result.p99}ms slow100=${result.slow100}`);
    if (perfWarnings.length) console.warn(`Performance warnings (non-fatal for functional smoke): ${perfWarnings.join('; ')}`);
    const failed = Object.entries(output).some(([name, result]) => {
      if (name === 'half-speed') return result.verdict !== 'movement-ok';
      if (name === 'boss-interaction-smoke') return !result.ok;
      return !result.reached || result.errors.length;
    });
    process.exitCode = failed ? 1 : 0;
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
