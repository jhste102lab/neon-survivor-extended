import { test, expect } from '@playwright/test';
import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
let server;
let baseURL;

test.beforeAll(async () => {
  server = http.createServer((req, res) => {
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
  baseURL = `http://127.0.0.1:${server.address().port}`;
});

test.afterAll(async () => { await new Promise(resolve => server.close(resolve)); });

test('title, start, level-up cards, BalanceSim cleanup', async ({ page }) => {
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.message));
  await page.goto(`${baseURL}/?remoteLb=0`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#titleOv:not(.hide)');
  await page.waitForFunction(() => window.NS && window.NS.Game && window.NS.Game.state === 'title');
  await page.click('#btnStart');
  await page.waitForFunction(() => window.NS.Game.state === 'play' && window.NS.Game.player && window.NS.Game.player.hp > 0 && window.NS.Game.player.weapons.length > 0);
  await page.evaluate(() => {
    window.NS.Game.test.manualClock = true;
    window.NS.Game.levelQueue = 1;
    window.NS.Game.state = 'levelup';
    window.NS.UI.showLevelUp();
  });
  await expect(page.locator('#cards .card').first()).toBeVisible();
  const sim = await page.evaluate(() => {
    const result = window.NS.sim.run({ seconds: 3, seed: 7, dt: 1 / 30, endless: false });
    return { time: result.time, headless: window.NS.Game.test.headless, manualClock: window.NS.Game.test.manualClock };
  });
  expect(sim.headless).toBe(false);
  expect(sim.manualClock).toBe(false);
  expect(errors).toEqual([]);
});
