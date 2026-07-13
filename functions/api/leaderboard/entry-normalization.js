import { WIN_TIME_SECONDS } from './config.js';
function cleanName(name) {
  const safe = String(name || '').trim().replace(/\s+/g, '').replace(/[<>&"'`]/g, '');
  return Array.from(safe).slice(0, 20).join('');
}

function boundedNumber(value, min, max, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function cleanSubmittedAt(raw, stamp) {
  if (stamp) return stamp;
  const parsed = Date.parse(String(raw || ''));
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : new Date().toISOString();
}

function cleanStringArray(value, maxItems = 16, maxLen = 32) {
  if (!Array.isArray(value)) return [];
  return value.map(v => String(v || '').replace(/[^\w:-]/g, '').slice(0, maxLen)).filter(Boolean).slice(0, maxItems);
}

function cleanSpecialKillKey(key) {
  return String(key).replace(/[^\w:-]/g, '').slice(0, 24);
}

function cleanSpecialKillCount(count) {
  return Math.round(boundedNumber(count, 0, 100000, 0));
}

function cleanSpecialKills(value) {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(
    Object.entries(value)
      .slice(0, 10)
      .map(([key, count]) => [cleanSpecialKillKey(key), cleanSpecialKillCount(count)]),
  );
}


function cleanRows(value, maxRows = 5) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, maxRows).map(row => ({
    source: String(row && row.source || '').replace(/[<>"'`]/g, '').slice(0, 48),
    value: Math.round(boundedNumber(row && row.value, 0, 1000000000, 0)),
  })).filter(row => row.source && row.value > 0);
}


function cleanRunSettings(value) {
  if (!value || typeof value !== 'object') return null;
  const weaponCapRaw = String(value.weaponCap || 'default');
  const weaponCap = ['default', '10', '15', '20', 'all'].includes(weaponCapRaw) ? weaponCapRaw : 'default';
  const enemyMode = value.enemyMode === 'half' ? 'half' : 'default';
  const dropFilters = value.dropFilters && typeof value.dropFilters === 'object' ? value.dropFilters : {};
  return {
    weaponCap,
    enemyMode,
    enemyDensity: boundedNumber(value.enemyDensity, 0.25, 1.5, enemyMode === 'half' ? 0.5 : 1),
    enemyStatMul: boundedNumber(value.enemyStatMul, 0.5, 5, enemyMode === 'half' ? 1.8 : 1),
    weaponCapBonusDamage: Math.round(boundedNumber(value.weaponCapBonusDamage, 0, 100, 0)),
    weaponCapBonusThresholds: Array.isArray(value.weaponCapBonusThresholds) ? value.weaponCapBonusThresholds.slice(0, 3).map(v => Math.round(boundedNumber(v, 0, 30, 0))).filter(Boolean) : [],
    dropFilters: { chicken: dropFilters.chicken !== false, magnet: dropFilters.magnet !== false, bomb: dropFilters.bomb !== false },
  };
}

function cleanBuildSnapshot(value) {
  if (!value || typeof value !== 'object') return null;
  return {
    weapons: Array.isArray(value.weapons) ? value.weapons.slice(0, 16).map(w => ({
      id: String(w && w.id || '').replace(/[^\w:-]/g, '').slice(0, 24),
      lv: Math.round(boundedNumber(w && w.lv, 1, 1000, 1)),
      evolved: !!(w && w.evolved),
    })).filter(w => w.id) : [],
    passives: Array.isArray(value.passives) ? value.passives.slice(0, 16).map(x => ({
      id: String(x && x.id || '').replace(/[^\w:-]/g, '').slice(0, 24),
      lv: Math.round(boundedNumber(x && x.lv, 0, 1000, 0)),
    })).filter(x => x.id && x.lv > 0) : [],
    damageTop: cleanRows(value.damageTop, 5),
    killsTop: cleanRows(value.killsTop, 5),
    healing: cleanRows(value.healing, 3),
    drops: value.drops && typeof value.drops === 'object'
      ? Object.fromEntries(Object.entries(value.drops).slice(0, 8).map(([k, v]) => [String(k).replace(/[^\w:-]/g, '').slice(0, 24), Math.round(boundedNumber(v, 0, 1000000, 0))]))
      : {},
    lastHit: String(value.lastHit || '').replace(/[<>"'`]/g, '').slice(0, 48),
    recentDamage: Array.isArray(value.recentDamage) ? value.recentDamage.slice(0, 5).map(d => ({
      t: boundedNumber(d && d.t, 0, 21600, 0),
      source: String(d && d.source || '').replace(/[<>"'`]/g, '').slice(0, 48),
      kind: String(d && d.kind || '').replace(/[<>"'`]/g, '').slice(0, 24),
      damage: Math.round(boundedNumber(d && d.damage, 0, 100000, 0)),
    })) : [],
    fieldTest: !!value.fieldTest,
    settings: cleanRunSettings(value.settings),
  };
}

export function normalizeEntry(raw, stamp = '') {
  if (!raw || typeof raw !== 'object') return null;

  const runId = String(raw.runId || '').replace(/[^\w:-]/g, '').slice(0, 64);
  const name = cleanName(raw.name);
  const time = boundedNumber(raw.time, 0, 21600, 0);
  if (!runId || !name || time <= 0) return null;

  const cleared20 = !!raw.cleared20 && time >= 1200;
  return {
    runId,
    name,
    time,
    kills: Math.round(boundedNumber(raw.kills, 0, 10000000, 0)),
    level: Math.round(boundedNumber(raw.level, 1, 10000, 1)),
    maxCombo: Math.round(boundedNumber(raw.maxCombo, 0, 10000000, 0)),
    won: !!raw.won,
    endless: !!raw.endless || time > WIN_TIME_SECONDS,
    mode: raw.mode === 'endless' || raw.endless || time > WIN_TIME_SECONDS ? 'endless' : 'standard',
    submittedAt: cleanSubmittedAt(raw.submittedAt, stamp),
    ruleset: String(raw.ruleset || '').slice(0, 40),
    evolved: cleanStringArray(raw.evolved, 8, 24),
    companionRoles: cleanStringArray(raw.companionRoles, 8, 24),
    eventSuccess: Math.round(boundedNumber(raw.eventSuccess, 0, 10000, 0)),
    bossesKilled: Math.round(boundedNumber(raw.bossesKilled, 0, 10000, 0)),
    specialKills: cleanSpecialKills(raw.specialKills),
    build: cleanBuildSnapshot(raw.build),
    cleared20,
    clearTime: cleared20 ? 1200 : 0,
  };
}
