import { SESSION_PAYLOAD_LIMIT_BYTES } from './leaderboard/config.js';
import { createJsonResponse, createOptionsResponse } from './leaderboard/http-response.js';
import { sessionKey } from './leaderboard/kv-keys.js';
import { readJsonRequestBody } from './leaderboard/request-body.js';
import { clientIdentity } from './leaderboard/request-identity.js';
import { allowPost } from './leaderboard/rate-limit.js';
import { shortHash } from './leaderboard/short-hash.js';

function cleanRunId(raw) {
  return String(raw || '').replace(/[^\w:-]/g, '').slice(0, 64);
}

function newProof() {
  return `${crypto.randomUUID()}-${crypto.randomUUID()}`.replace(/[^\w-]/g, '').slice(0, 96);
}

export async function onRequestPost({ request, env }) {
  if (!env.LEADERBOARD) return createJsonResponse({ error: 'leaderboard_unavailable' }, 503);
  try {
    if (!(await allowPost(env, request, 'session'))) return createJsonResponse({ error: 'rate_limited' }, 429);
    const bodyResult = await readJsonRequestBody(request, SESSION_PAYLOAD_LIMIT_BYTES);
    if (!bodyResult.ok) return createJsonResponse({ error: bodyResult.error || 'invalid_json' }, bodyResult.error === 'payload_too_large' ? 413 : 400);

    const body = bodyResult.body || {};
    const runId = cleanRunId(body.runId) || crypto.randomUUID();
    const proof = newProof();
    const ipHash = await shortHash(clientIdentity(request));
    await env.LEADERBOARD.put(sessionKey(env, proof), JSON.stringify({
      runId,
      ipHash,
      startedAt: Date.now(),
    }), { expirationTtl: 21600 });

    return createJsonResponse({ runId, proof }, 201);
  } catch (e) {
    return createJsonResponse({ error: 'leaderboard_unavailable' }, 503);
  }
}

export function onRequestOptions() {
  return createOptionsResponse();
}
