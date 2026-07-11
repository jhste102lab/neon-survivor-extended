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


  compactSourceRows(map, limit = 5) {
    if (!map || typeof map !== 'object') return [];
    return Object.entries(map)
      .map(([source, value]) => ({ source: String(source).slice(0, 48), value: Math.round(Number(value) || 0) }))
      .filter(row => row.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  },

  buildSnapshotFromGame(game = Game) {
    const p = game.player || {};
    const metrics = game.metrics || {};
    return {
      weapons: (p.weapons || []).map(w => ({ id: String(w.id).slice(0, 24), lv: Math.round(Number(w.lv) || 1), evolved: !!(p.evolved && p.evolved[w.id]) })).slice(0, 16),
      passives: Object.entries(p.passives || {}).map(([id, lv]) => ({ id: String(id).slice(0, 24), lv: Math.round(Number(lv) || 0) })).filter(x => x.lv > 0).slice(0, 16),
      damageTop: this.compactSourceRows(metrics.damageBySource, 5),
      killsTop: this.compactSourceRows(metrics.killsBySource, 5),
      healing: this.compactSourceRows(metrics.healingBySource, 3),
      drops: metrics.dropsCollected && typeof metrics.dropsCollected === 'object' ? { ...metrics.dropsCollected } : (metrics.dropsSpawned && typeof metrics.dropsSpawned === 'object' ? { ...metrics.dropsSpawned } : {}),
      lastHit: String(metrics.deathSource || metrics.lastDamageSource || '').slice(0, 48),
      recentDamage: Array.isArray(metrics.deathRecentDamage && metrics.deathRecentDamage.length ? metrics.deathRecentDamage : metrics.recentDamage)
        ? (metrics.deathRecentDamage && metrics.deathRecentDamage.length ? metrics.deathRecentDamage : metrics.recentDamage).slice(-5).map(d => ({ t: Number(d.t) || 0, source: String(d.source || '').slice(0, 48), kind: String(d.kind || '').slice(0, 24), damage: Math.round(Number(d.damage) || 0) }))
        : [],
      fieldTest: !!(game.fieldTestTouched || game.fieldTestRun || game.fieldTestInvincible),
      settings: this.buildRunSettingsSnapshot(game),
    };
  },

  buildRunSettingsSnapshot(game = Game) {
    const run = game.runSettings || {};
    const drops = typeof DropPreferences !== 'undefined' ? DropPreferences.load() : {};
    return {
      weaponCap: String(run.weaponCap || 'default').slice(0, 12),
      enemyMode: String(run.enemyMode || 'default').slice(0, 12),
      enemyDensity: Number(run.enemyDensity || (run.enemyMode === 'half' ? 0.5 : 1)) || 1,
      enemyStatMul: Number(run.enemyStatMul || (run.enemyMode === 'half' ? 1.8 : 1)) || 1,
      weaponCapBonusDamage: Math.round(Number(run.weaponCapBonusDamage || ((run.weaponCapBonusCount || 0) * 10)) || 0),
      weaponCapBonusThresholds: Array.isArray(run.weaponCapBonusThresholds) ? run.weaponCapBonusThresholds.slice(0, 3).map(Number).filter(Boolean) : [],
      dropFilters: { chicken: drops.chicken !== false, magnet: drops.magnet !== false, bomb: drops.bomb !== false },
    };
  },

  normalizeRunSettings(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const weaponCap = ['default', '60pct'].includes(String(raw.weaponCap)) ? String(raw.weaponCap) : 'default';
    const enemyMode = raw.enemyMode === 'half' ? 'half' : 'default';
    const dropFilters = raw.dropFilters && typeof raw.dropFilters === 'object' ? raw.dropFilters : {};
    return {
      weaponCap,
      enemyMode,
      enemyDensity: this.num(raw.enemyDensity, 0.25, 1.5, enemyMode === 'half' ? 0.5 : 1),
      enemyStatMul: this.num(raw.enemyStatMul, 0.5, 5, enemyMode === 'half' ? 1.8 : 1),
      weaponCapBonusDamage: Math.round(this.num(raw.weaponCapBonusDamage, 0, 100, 0)),
      weaponCapBonusThresholds: Array.isArray(raw.weaponCapBonusThresholds) ? raw.weaponCapBonusThresholds.slice(0, 3).map(v => Math.round(this.num(v, 0, 30, 0))).filter(Boolean) : [],
      dropFilters: { chicken: dropFilters.chicken !== false, magnet: dropFilters.magnet !== false, bomb: dropFilters.bomb !== false },
    };
  },

  normalizeBuildSnapshot(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const cleanRows = (rows, limit) => Array.isArray(rows) ? rows.slice(0, limit).map(row => ({ source: String(row.source || '').slice(0, 48), value: Math.round(this.num(row.value, 0, 1000000000, 0)) })).filter(row => row.source && row.value > 0) : [];
    return {
      weapons: Array.isArray(raw.weapons) ? raw.weapons.slice(0, 16).map(w => ({ id: String(w.id || '').replace(/[^\w:-]/g, '').slice(0, 24), lv: Math.round(this.num(w.lv, 1, 1000, 1)), evolved: !!w.evolved })).filter(w => w.id) : [],
      passives: Array.isArray(raw.passives) ? raw.passives.slice(0, 16).map(x => ({ id: String(x.id || '').replace(/[^\w:-]/g, '').slice(0, 24), lv: Math.round(this.num(x.lv, 0, 1000, 0)) })).filter(x => x.id && x.lv > 0) : [],
      damageTop: cleanRows(raw.damageTop, 5),
      killsTop: cleanRows(raw.killsTop, 5),
      healing: cleanRows(raw.healing, 3),
      drops: raw.drops && typeof raw.drops === 'object' ? Object.fromEntries(Object.entries(raw.drops).slice(0, 8).map(([k, v]) => [String(k).replace(/[^\w:-]/g, '').slice(0, 24), Math.round(this.num(v, 0, 1000000, 0))])) : {},
      lastHit: String(raw.lastHit || '').slice(0, 48),
      recentDamage: Array.isArray(raw.recentDamage) ? raw.recentDamage.slice(0, 5).map(d => ({ t: this.num(d.t, 0, 21600, 0), source: String(d.source || '').slice(0, 48), kind: String(d.kind || '').slice(0, 24), damage: Math.round(this.num(d.damage, 0, 100000, 0)) })) : [],
      fieldTest: !!raw.fieldTest,
      settings: this.normalizeRunSettings(raw.settings),
    };
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
      build: this.normalizeBuildSnapshot(raw.build),
      cleared20: !!raw.cleared20 && time >= (CFG.clearTime || 1200),
      clearTime: !!raw.cleared20 && time >= (CFG.clearTime || 1200) ? (CFG.clearTime || 1200) : 0,
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
      cleared20: !!Game.cleared20,
      clearTime: Game.cleared20 ? (CFG.clearTime || 1200) : 0,
      build: this.buildSnapshotFromGame(Game),
    });
  },
};
