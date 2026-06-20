'use strict';
// Leaderboard entry normalization, ordering, upsert, and Game-state mapping.
const LeaderboardEntry = {
  cleanName(name) {
    return Profile.sanitizeName(name) || Profile.generateName();
  },

  num(v, min, max, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? clamp(n, min, max) : fallback;
  },

  normalizeEntry(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const time = this.num(raw.time, 0, 21600, 0);
    const entry = {
      runId: String(raw.runId || Profile.runId()).replace(/[^\w:-]/g, '').slice(0, 64) || Profile.runId(),
      name: this.cleanName(raw.name),
      time,
      kills: Math.round(this.num(raw.kills, 0, 10000000, 0)),
      level: Math.round(this.num(raw.level, 1, 10000, 1)),
      maxCombo: Math.round(this.num(raw.maxCombo, 0, 10000000, 0)),
      won: !!raw.won,
      endless: !!raw.endless || time > LEADERBOARD_CONTRACT.winTimeSeconds,
      mode: raw.mode === 'endless' || raw.endless || time > LEADERBOARD_CONTRACT.winTimeSeconds ? 'endless' : 'standard',
      submittedAt: String(raw.submittedAt || new Date().toISOString()).slice(0, 40),
      ruleset: String(raw.ruleset || LEADERBOARD_CONTRACT.ruleset).slice(0, 40),
      evolved: Array.isArray(raw.evolved) ? raw.evolved.map(String).slice(0, 8) : [],
      companionRoles: Array.isArray(raw.companionRoles) ? raw.companionRoles.map(String).slice(0, 8) : [],
      eventSuccess: Math.round(this.num(raw.eventSuccess, 0, 10000, 0)),
      bossesKilled: Math.round(this.num(raw.bossesKilled, 0, 10000, 0)),
      specialKills: raw.specialKills && typeof raw.specialKills === 'object' ? { ...raw.specialKills } : {},
    };
    return entry.time > 0 ? entry : null;
  },

  compare(a, b) {
    return (b.time - a.time)
      || (b.kills - a.kills)
      || (b.level - a.level)
      || (b.maxCombo - a.maxCombo)
      || String(a.submittedAt).localeCompare(String(b.submittedAt));
  },

  normalizeList(entries, limit) {
    return entries
      .map(e => this.normalizeEntry(e))
      .filter(Boolean)
      .sort((a, b) => this.compare(a, b))
      .slice(0, limit);
  },

  upsert(entries, entry, limit) {
    const normalized = this.normalizeEntry(entry);
    if (!normalized) return entries.slice(0, limit);
    const next = entries.filter(e => e && e.runId !== normalized.runId);
    next.push(normalized);
    next.sort((a, b) => this.compare(a, b));
    return next.slice(0, limit);
  },

  entryFromGame(won, activeProof = '') {
    const looped = !!Game.endless || Game.time >= LEADERBOARD_CONTRACT.winTimeSeconds;
    return this.normalizeEntry({
      runId: Game.runId || Profile.runId(),
      name: Profile.ensureName(),
      time: Game.time,
      kills: Game.kills,
      level: Game.player.level,
      maxCombo: Game.maxCombo,
      won: !!won,
      endless: looped,
      mode: looped ? 'endless' : 'standard',
      submittedAt: new Date().toISOString(),
      proof: Game.runProof || activeProof || '',
      ruleset: LEADERBOARD_CONTRACT.ruleset,
      evolved: Object.keys(Game.player.evolved || {}),
      companionRoles: Game.player.companions && Game.player.companions.roles ? [...Game.player.companions.roles] : [],
      eventSuccess: Game.metrics ? Game.metrics.eventSuccess || 0 : 0,
      bossesKilled: Game.metrics ? Game.metrics.bossesKilled || 0 : 0,
      specialKills: Game.metrics ? { ...(Game.metrics.specialKills || {}) } : {},
    });
  },
};
