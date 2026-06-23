#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(new URL('..', import.meta.url).pathname);
let fetchImpl = async () => ({ ok: true, status: 200, json: async () => ({ entries: [] }) });
const context = vm.createContext({
  console,
  window: {},
  location: { href: 'https://example.pages.dev/', protocol: 'https:', hostname: 'example.pages.dev', search: '' },
  URL,
  URLSearchParams,
  setTimeout,
  fetch: (...args) => fetchImpl(...args),
  Profile: { ensureName: () => 'Tester' },
});
vm.runInContext(readFileSync(path.join(root, 'src/leaderboard-remote.js'), 'utf8'), context, { filename: 'src/leaderboard-remote.js' });
const LeaderboardRemote = vm.runInContext('LeaderboardRemote', context);
function assert(condition, message) { if (!condition) throw new Error(message); }

{
  context.location.href = 'http://localhost:5173/';
  context.location.protocol = 'http:';
  context.location.hostname = 'localhost';
  context.location.search = '';
  const state = { apiPath: '/api/leaderboard' };
  assert(LeaderboardRemote.enabled(state) === true, 'localhost should use public Cloudflare leaderboard by default');
  assert(state.apiPath === 'https://neon-survivor.pages.dev/api/leaderboard', 'localhost should point at public leaderboard API');
}

{
  context.location.href = 'http://localhost:5173/?remoteLb=0';
  context.location.protocol = 'http:';
  context.location.hostname = 'localhost';
  context.location.search = '?remoteLb=0';
  const state = { apiPath: '/api/leaderboard' };
  assert(LeaderboardRemote.enabled(state) === false, 'remoteLb=0 should disable remote leaderboard even on localhost');
}

{
  context.location.href = 'file:///tmp/index.html';
  context.location.protocol = 'file:';
  context.location.hostname = '';
  const state = { apiPath: '/api/leaderboard' };
  assert(LeaderboardRemote.enabled(state) === false, 'file URLs should remain local-only');
}

{
  const c = LeaderboardRemote.classifyResponseError(422, { error: 'implausible_entry' });
  assert(c.kind === 'contract_rejected', '422 should be classified as contract rejection');
  assert(c.message.includes('contract rejected'), 'contract rejection message should be explicit');
}

{
  const c = LeaderboardRemote.classifyResponseError(503, { error: 'leaderboard_unavailable' });
  assert(c.kind === 'remote_unavailable', '503 should be classified as remote outage');
}

{
  fetchImpl = async () => ({ ok: false, status: 403, json: async () => ({ error: 'session_already_submitted' }) });
  let error;
  try { await LeaderboardRemote.submitEntry('/api/leaderboard', { runId: 'r1' }); }
  catch (e) { error = e; }
  assert(error && error.leaderboardKind === 'contract_rejected', 'submit contract failure should expose warning kind');
  assert(LeaderboardRemote.publicFallbackReason(error).startsWith('contract rejected:'), 'fallback reason should distinguish contract rejection');
}

{
  fetchImpl = async () => { throw new Error('ECONNRESET'); };
  let error;
  try { await LeaderboardRemote.loadEntries('/api/leaderboard'); }
  catch (e) { error = e; }
  assert(error && error.leaderboardKind === 'network_unavailable', 'network failure should expose network warning kind');
  assert(LeaderboardRemote.publicFallbackReason(error).startsWith('network unavailable:'), 'fallback reason should distinguish network outage');
}

console.log('Leaderboard remote error classification tests passed.');
