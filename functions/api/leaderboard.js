import { PUBLIC_LIMIT, POST_PAYLOAD_LIMIT_BYTES } from './leaderboard/config.js';
import { isEntryPlausible } from './leaderboard/entry-plausibility.js';
import { normalizeEntry } from './leaderboard/entry-normalization.js';
import { createJsonResponse, createOptionsResponse } from './leaderboard/http-response.js';
import { readEntries, upsertEntry } from './leaderboard/kv-repository.js';
import { hasOversizedPayload, readJsonRequestBody } from './leaderboard/request-body.js';
import { allowPost } from './leaderboard/rate-limit.js';
import { markSessionSubmitted, validateSession } from './leaderboard/session-validation.js';

export async function onRequestGet({ env }) {
  try {
    const entries = await readEntries(env);
    return createJsonResponse({ entries: entries.slice(0, PUBLIC_LIMIT) });
  } catch (e) {
    return createJsonResponse({ entries: [], error: 'leaderboard_unavailable' }, 503);
  }
}

export async function onRequestPost({ request, env }) {
  if (!env.LEADERBOARD) return createJsonResponse({ error: 'leaderboard_unavailable' }, 503);
  if (!(await allowPost(env, request))) return createJsonResponse({ error: 'rate_limited' }, 429);
  if (hasOversizedPayload(request, POST_PAYLOAD_LIMIT_BYTES)) return createJsonResponse({ error: 'payload_too_large' }, 413);

  const bodyResult = await readJsonRequestBody(request, POST_PAYLOAD_LIMIT_BYTES);
  if (!bodyResult.ok) return createJsonResponse({ error: bodyResult.error || 'invalid_json' }, bodyResult.error === 'payload_too_large' ? 413 : 400);

  const entry = normalizeEntry(bodyResult.body, new Date().toISOString());
  if (!entry) return createJsonResponse({ error: 'invalid_entry' }, 400);
  if (!isEntryPlausible(entry)) return createJsonResponse({ error: 'implausible_entry' }, 422);

  try {
    const session = await validateSession(env, request, bodyResult.body, entry);
    if (!session.ok) return createJsonResponse({ error: session.error }, 403);

    await markSessionSubmitted(env, session.proof, session.session, session.fingerprint);
    const stored = await upsertEntry(env, entry, { proofHash: session.fingerprint });
    return createJsonResponse({ accepted: true, entries: stored.slice(0, PUBLIC_LIMIT) }, 201);
  } catch (e) {
    if (e && e.publicCode) return createJsonResponse({ error: e.publicCode }, e.status || 409);
    return createJsonResponse({ error: 'leaderboard_unavailable' }, 503);
  }
}

export function onRequestOptions() {
  return createOptionsResponse();
}
