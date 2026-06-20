#!/usr/bin/env node
import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const root = process.env.NEON_ROOT ? path.resolve(process.env.NEON_ROOT) : path.resolve(new URL('..', import.meta.url).pathname);
const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://127.0.0.1');
  const filePath = path.join(root, url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname));
  if (!filePath.startsWith(root) || !existsSync(filePath) || statSync(filePath).isDirectory()) {
    res.writeHead(404); res.end('not found'); return;
  }
  const type = filePath.endsWith('.js') ? 'text/javascript' : filePath.endsWith('.css') ? 'text/css' : 'text/html';
  res.writeHead(200, { 'content-type': `${type}; charset=utf-8` });
  createReadStream(filePath).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
page.on('pageerror', err => errors.push(err.message));
try {
  await page.goto(`http://127.0.0.1:${port}/?remoteLb=0`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#titleOv:not(.hide)', { timeout: 5000 });
  await page.waitForFunction(() => window.NS && window.NS.Game && window.NS.Game.state === 'title');
  await page.click('#btnStart');
  await page.waitForFunction(() => window.NS.Game.state === 'play' && window.NS.Game.player && window.NS.Game.player.hp > 0 && window.NS.Game.player.weapons.length > 0, null, { timeout: 5000 }).catch(async err => {
    const debug = await page.evaluate(() => ({
      ns: !!window.NS,
      state: window.NS && window.NS.Game && window.NS.Game.state,
      player: window.NS && window.NS.Game && !!window.NS.Game.player,
      titleClasses: document.getElementById('titleOv')?.className,
      startText: document.getElementById('btnStart')?.textContent,
    }));
    throw new Error(`${err.message}; debug=${JSON.stringify(debug)}; console=${errors.join(' | ')}`);
  });
  await page.evaluate(() => {
    window.NS.Game.test.manualClock = true;
    window.NS.Game.levelQueue = 1;
    window.NS.Game.state = 'play';
    window.NS.UI.showLevelUp();
  });
  await page.waitForSelector('#cards .card', { timeout: 5000 });
  const cards = await page.locator('#cards .card').count();
  if (cards < 1) throw new Error('level-up cards did not render');
  const sim = await page.evaluate(() => {
    window.NS.Game.test.manualClock = false;
    window.NS.Game.state = 'play';
    const result = window.NS.sim.run({ seconds: 3, seed: 7, dt: 1 / 30, endless: false });
    return { time: result.time, state: window.NS.Game.state, headless: window.NS.Game.test.headless, manualClock: window.NS.Game.test.manualClock };
  });
  if (sim.headless || sim.manualClock) throw new Error(`BalanceSim cleanup leaked flags: ${JSON.stringify(sim)}`);
  if (errors.length) throw new Error(`page console errors: ${errors.join(' | ')}`);
  console.log('Browser smoke passed: title, start, level-up cards, BalanceSim cleanup.');
} finally {
  await browser.close();
  server.close();
}
