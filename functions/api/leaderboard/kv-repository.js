import { STORAGE_LIMIT } from './config.js';
import { normalizeEntry } from './entry-normalization.js';
import { rankEntries } from './entry-ranking.js';
import { leaderboardEntryKey, leaderboardEntryPrefix } from './kv-keys.js';

function leaderboardKv(env) {
  if (!env.LEADERBOARD) throw new Error('LEADERBOARD KV binding is missing');
  return env.LEADERBOARD;
}

function normalizeStoredEntries(stored) {
  if (!Array.isArray(stored)) return [];
  return rankEntries(stored.map(entry => normalizeEntry(entry)).filter(Boolean));
}

async function listEntryKeys(kv, prefix) {
  if (typeof kv.list !== 'function') return [];
  const keys = [];
  let cursor;
  do {
    const page = await kv.list({ prefix, cursor });
    keys.push(...(page.keys || []).map(key => key.name).filter(Boolean));
    cursor = page.list_complete === false ? page.cursor : null;
  } while (cursor);
  return keys;
}

export async function readEntries(env) {
  const kv = leaderboardKv(env);
  const keys = await listEntryKeys(kv, leaderboardEntryPrefix(env));
  const entries = [];
  for (const key of keys) {
    const entry = await kv.get(key, { type: 'json' });
    if (entry) entries.push(entry);
  }
  return normalizeStoredEntries(entries);
}

export async function readEntryByRunId(env, runId) {
  return leaderboardKv(env).get(leaderboardEntryKey(env, runId), { type: 'json' });
}

export async function upsertEntry(env, entry, metadata = {}) {
  const kv = leaderboardKv(env);
  const key = leaderboardEntryKey(env, entry.runId);
  const existing = await kv.get(key, { type: 'json' });
  if (existing && existing.proofHash && metadata.proofHash && existing.proofHash !== metadata.proofHash) {
    const error = new Error('entry_conflict');
    error.publicCode = 'session_already_submitted';
    error.status = 403;
    throw error;
  }
  const storedEntry = { ...entry, ...metadata };
  await kv.put(key, JSON.stringify(storedEntry));
  return (await readEntries(env)).slice(0, STORAGE_LIMIT);
}
