import { RATE_LIMIT_PER_MINUTE, RATE_LIMIT_TTL_SECONDS, RATE_LIMIT_WINDOW_MS } from './config.js';
import { rateLimitAttemptKey, rateLimitPrefix } from './kv-keys.js';
import { clientIdentity } from './request-identity.js';
import { shortHash } from './short-hash.js';

function currentRateWindow() {
  return Math.floor(Date.now() / RATE_LIMIT_WINDOW_MS);
}

async function listAttemptKeys(kv, prefix) {
  if (typeof kv.list !== 'function') return [];
  const keys = [];
  let cursor;
  do {
    const page = await kv.list({ prefix, cursor });
    keys.push(...(page.keys || []).map(key => key.name).filter(Boolean));
    cursor = page.list_complete === false ? page.cursor : null;
  } while (cursor);
  return keys.sort();
}

export async function allowPost(env, request, scope = 'submit') {
  const kv = env.LEADERBOARD;
  const windowId = currentRateWindow();
  const identityHash = await shortHash(clientIdentity(request));
  const prefix = rateLimitPrefix(env, scope, windowId, identityHash);
  const used = await listAttemptKeys(kv, prefix);
  if (used.length >= RATE_LIMIT_PER_MINUTE) return false;
  const attemptId = `${Date.now().toString(36)}-${crypto.randomUUID()}`;
  const attemptKey = rateLimitAttemptKey(env, scope, windowId, identityHash, attemptId);
  await kv.put(attemptKey, '1', { expirationTtl: RATE_LIMIT_TTL_SECONDS });
  const ranked = await listAttemptKeys(kv, prefix);
  const rank = ranked.indexOf(attemptKey);
  return rank < 0 || rank < RATE_LIMIT_PER_MINUTE;
}
