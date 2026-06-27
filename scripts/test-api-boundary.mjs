#!/usr/bin/env node
import { cpSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const temp = mkdtempSync(path.join(tmpdir(), 'neon-api-tests-'));
cpSync(path.join(root, 'functions'), path.join(temp, 'functions'), { recursive: true });
writeFileSync(path.join(temp, 'package.json'), '{"type":"module"}\n');

const sessionApi = await import(pathToFileURL(path.join(temp, 'functions/api/session.js')));
const leaderboardApi = await import(pathToFileURL(path.join(temp, 'functions/api/leaderboard.js')));
const config = await import(pathToFileURL(path.join(temp, 'functions/api/leaderboard/config.js')));

class FakeKV {
  constructor() { this.map = new Map(); }
  async get(key, opts = {}) {
    const raw = this.map.get(key);
    if (raw == null) return null;
    return opts.type === 'json' ? JSON.parse(raw) : raw;
  }
  async put(key, value) { this.map.set(key, String(value)); }
  async list({ prefix = '' } = {}) {
    return { list_complete: true, keys: [...this.map.keys()].filter(name => name.startsWith(prefix)).sort().map(name => ({ name })) };
  }
}

class DelayedRateKV extends FakeKV {
  constructor(expectedAttempts) {
    super();
    this.expectedAttempts = expectedAttempts;
    this.puts = 0;
    this.listCalls = 0;
    this.initialWaiters = [];
    this.waiters = [];
  }

  async put(key, value) {
    await super.put(key, value);
    this.puts++;
    if (this.puts >= this.expectedAttempts) this.waiters.splice(0).forEach(resolve => resolve());
  }

  async list(options = {}) {
    this.listCalls++;
    if (this.listCalls <= this.expectedAttempts) {
      if (this.listCalls === this.expectedAttempts) this.initialWaiters.splice(0).forEach(resolve => resolve());
      else await new Promise(resolve => this.initialWaiters.push(resolve));
      return { list_complete: true, keys: [] };
    }
    if (this.puts < this.expectedAttempts) {
      await new Promise(resolve => this.waiters.push(resolve));
    }
    return super.list(options);
  }
}

function env(kv = new FakeKV()) { return { LEADERBOARD: kv, LEADERBOARD_PREFIX: 'testenv' }; }
function req(body, headers = {}) {
  return new Request('https://example.test/api/session', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body });
}
async function json(response) { return response.json(); }
function assert(condition, message) { if (!condition) throw new Error(message); }
function entryFor(runId, proof, overrides = {}) {
  return {
    runId, name: 'Tester', time: 5, kills: 5, level: 2, maxCombo: 3,
    won: false, endless: false, mode: 'standard', ruleset: config.RULESET,
    proof,
    ...overrides,
  };
}
async function createSession(envObj, runId, headers = {}) {
  const response = await sessionApi.onRequestPost({ request: req(JSON.stringify({ runId, name: 'Tester' }), headers), env: envObj });
  assert(response.status === 201, `session create ${runId} status ${response.status}`);
  return json(response);
}

const e1 = env();
let res = await sessionApi.onRequestPost({ request: req('{bad json'), env: e1 });
assert(res.status === 400, `invalid session JSON status ${res.status}`);
assert((await json(res)).error === 'invalid_json', 'invalid JSON error code');

res = await sessionApi.onRequestPost({ request: req(JSON.stringify({ runId: 'oversize' }).padEnd(2100, 'x'), {}), env: env() });
assert(res.status === 413, `oversized session status ${res.status}`);

const e2 = env();
res = await sessionApi.onRequestPost({ request: req(JSON.stringify({ runId: 'run-a', name: 'Tester' })), env: e2 });
assert(res.status === 201, `session create status ${res.status}`);
const session = await json(res);
assert(session.runId === 'run-a' && session.proof, 'session response includes runId/proof');
assert([...e2.LEADERBOARD.map.keys()].some(key => key.startsWith('testenv:session:')), 'session key uses env prefix');

const entry = entryFor('run-a', session.proof);
res = await leaderboardApi.onRequestPost({ request: req(JSON.stringify(entry)), env: e2 });
if (res.status !== 201) throw new Error(`leaderboard submit status ${res.status} ${JSON.stringify(await json(res))}`);
assert([...e2.LEADERBOARD.map.keys()].some(key => key.startsWith('testenv:entry:phase3-2026-06-27-late-rebalance:run-a')), 'entry key uses env/ruleset/run prefix');

res = await leaderboardApi.onRequestPost({ request: req(JSON.stringify(entry)), env: e2 });
assert(res.status === 201, `exact retry status ${res.status}`);
assert((await json(res)).accepted === true, 'exact retry is idempotently accepted');

res = await leaderboardApi.onRequestPost({ request: req(JSON.stringify({ ...entry, kills: 999 })), env: e2 });
assert(res.status === 403, `changed retry status ${res.status}`);
assert((await json(res)).error === 'session_already_submitted', 'changed retry rejected');

const eConcurrent = env();
const [sA, sB] = await Promise.all([createSession(eConcurrent, 'run-b'), createSession(eConcurrent, 'run-c')]);
const concurrentStatuses = await Promise.all([
  leaderboardApi.onRequestPost({ request: req(JSON.stringify(entryFor('run-b', sA.proof, { kills: 6 }))), env: eConcurrent }),
  leaderboardApi.onRequestPost({ request: req(JSON.stringify(entryFor('run-c', sB.proof, { kills: 7 }))), env: eConcurrent }),
]).then(rs => rs.map(r => r.status));
assert(concurrentStatuses.every(status => status === 201), `distinct concurrent submit statuses ${concurrentStatuses.join(',')}`);
res = await leaderboardApi.onRequestGet({ env: eConcurrent });
const concurrentEntries = (await json(res)).entries;
assert(concurrentEntries.some(entry => entry.runId === 'run-b'), 'concurrent entry run-b retained');
assert(concurrentEntries.some(entry => entry.runId === 'run-c'), 'concurrent entry run-c retained');


const eFast = env();
const fastSession = await createSession(eFast, 'run-fast');
const fastSessionKey = [...eFast.LEADERBOARD.map.keys()].find(key => key.startsWith('testenv:session:'));
const fastSessionRecord = JSON.parse(eFast.LEADERBOARD.map.get(fastSessionKey));
fastSessionRecord.startedAt = Date.now() - 10000;
eFast.LEADERBOARD.map.set(fastSessionKey, JSON.stringify(fastSessionRecord));
res = await leaderboardApi.onRequestPost({ request: req(JSON.stringify(entryFor('run-fast', fastSession.proof, { time: 30, kills: 10, level: 3 }))), env: eFast });
assert(res.status === 201, `accelerated legal run status ${res.status} ${JSON.stringify(await json(res))}`);

const e3 = env(new DelayedRateKV(13));
const attempts = [];
for (let i = 0; i < 13; i++) attempts.push(sessionApi.onRequestPost({ request: req(JSON.stringify({ runId: `r${i}` }), { 'CF-Connecting-IP': '203.0.113.5' }), env: e3 }));
const statuses = await Promise.all(attempts).then(rs => rs.map(r => r.status));
assert(statuses.filter(s => s === 201).length <= config.RATE_LIMIT_PER_MINUTE, `too many accepted requests: ${statuses.join(',')}`);
assert(statuses.filter(s => s === 429).length >= 1, `expected at least one rate-limited request, got ${statuses.join(',')}`);

console.log('API boundary/rate/idempotency tests passed.');
