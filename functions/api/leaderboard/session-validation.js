import { MAX_CLIENT_TIME_SCALE, SESSION_TIME_GRACE_SECONDS, WIN_TIME_SECONDS } from './config.js';
import { clientIdentity } from './request-identity.js';
import { sessionKey } from './kv-keys.js';
import { cleanSessionProof, entryFingerprint } from './session-proof.js';
import { shortHash } from './short-hash.js';

function failedSession(error) {
  return { ok: false, error };
}

function elapsedSeconds(session) {
  return (Date.now() - Number(session.startedAt || 0)) / 1000;
}

async function requestIdentityHash(request) {
  return shortHash(clientIdentity(request));
}

export async function validateSession(env, request, body, entry) {
  const proof = cleanSessionProof(body);
  if (!proof) return failedSession('missing_session');

  const session = await env.LEADERBOARD.get(sessionKey(env, proof), { type: 'json' });
  if (!session || session.runId !== entry.runId) return failedSession('invalid_session');

  const elapsed = elapsedSeconds(session);
  if (!Number.isFinite(elapsed) || elapsed < 0) return failedSession('invalid_session');
  const maxCreditedTime = elapsed * MAX_CLIENT_TIME_SCALE + SESSION_TIME_GRACE_SECONDS;
  if (entry.time > maxCreditedTime) return failedSession('time_ahead_of_session');
  if (entry.won && Math.min(entry.time, maxCreditedTime) < WIN_TIME_SECONDS - 10) return failedSession('win_too_early');

  const ipHash = await requestIdentityHash(request);
  if (session.ipHash && session.ipHash !== ipHash) return failedSession('session_owner_changed');

  const fingerprint = await entryFingerprint(entry);
  if (session.submission && session.submission.fingerprint !== fingerprint) return failedSession('session_already_submitted');
  return { ok: true, proof, fingerprint, session };
}

export async function markSessionSubmitted(env, proof, session, fingerprint) {
  if (!proof || !session) return;
  await env.LEADERBOARD.put(sessionKey(env, proof), JSON.stringify({
    ...session,
    submission: { fingerprint, submittedAt: Date.now() },
  }), { expirationTtl: 21600 });
}
