import { RULESET } from './config.js';

function cleanPart(value, fallback = 'default') {
  const cleaned = String(value || '').replace(/[^\w:-]/g, '').slice(0, 64);
  return cleaned || fallback;
}

export function keyPrefix(env) {
  return cleanPart(env && (env.LEADERBOARD_PREFIX || env.ENVIRONMENT || env.CF_PAGES_BRANCH), 'default');
}

export function prefixedKey(env, ...parts) {
  return [keyPrefix(env), ...parts.map(part => cleanPart(part, 'x'))].join(':');
}

export function leaderboardEntryPrefix(env) {
  return prefixedKey(env, 'entry', RULESET) + ':';
}

export function leaderboardEntryKey(env, runId) {
  return leaderboardEntryPrefix(env) + cleanPart(runId, 'run');
}

export function sessionKey(env, proof) {
  return prefixedKey(env, 'session', proof);
}

export function rateLimitPrefix(env, scope, windowId, identityHash) {
  return prefixedKey(env, 'rate', scope, windowId, identityHash) + ':';
}

export function rateLimitAttemptKey(env, scope, windowId, identityHash, attemptId) {
  return rateLimitPrefix(env, scope, windowId, identityHash) + cleanPart(attemptId, crypto.randomUUID());
}
