import { shortHash } from './short-hash.js';

export function cleanSessionProof(body) {
  return String(body.proof || '').replace(/[^\w:-]/g, '').slice(0, 96);
}

export async function entryFingerprint(entry) {
  const stable = {
    runId: entry.runId,
    name: entry.name,
    time: Math.round(entry.time * 1000) / 1000,
    kills: entry.kills,
    level: entry.level,
    maxCombo: entry.maxCombo,
    won: entry.won,
    endless: entry.endless,
    mode: entry.mode,
    ruleset: entry.ruleset,
    evolved: entry.evolved,
    companionRoles: entry.companionRoles,
    eventSuccess: entry.eventSuccess,
    bossesKilled: entry.bossesKilled,
    specialKills: entry.specialKills,
    build: entry.build,
  };
  return shortHash(JSON.stringify(stable));
}
