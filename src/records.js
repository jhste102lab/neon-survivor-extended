'use strict';
// Best-run persistence and leaderboard submission adapter.
const RunRecords = {
  bestKey: 'ns_best',

  emptyBest() {
    return { time: 0, kills: 0, level: 0, maxCombo: 0, wins: 0 };
  },

  normalizeBest(raw) {
    if (!raw || typeof raw !== 'object') return this.emptyBest();
    const num = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
    return {
      time: Math.max(0, num(raw.time)),
      kills: Math.max(0, Math.round(num(raw.kills))),
      level: Math.max(0, Math.round(num(raw.level))),
      wins: Math.max(0, Math.round(num(raw.wins))),
      maxCombo: Math.max(0, Math.round(num(raw.maxCombo))),
    };
  },

  loadBest() {
    try { return this.normalizeBest(JSON.parse(localStorage.getItem(this.bestKey) || 'null')); }
    catch (e) { return this.emptyBest(); }
  },

  writeBest(best) {
    try { localStorage.setItem(this.bestKey, JSON.stringify(this.normalizeBest(best))); }
    catch (e) { console.warn('Best-record write skipped; local storage unavailable.'); }
  },

  saveFromGame(game = Game, won = false) {
    if (game.fieldTestTouched || game.fieldTestRun || game.fieldTestInvincible) return false;
    const best = this.normalizeBest(game.best);
    const newBest = game.time > best.time;
    if (newBest) best.time = game.time;
    best.kills = Math.max(best.kills, game.kills);
    best.level = Math.max(best.level, game.player.level);
    best.maxCombo = Math.max(best.maxCombo || 0, game.maxCombo || 0);
    if (won) best.wins = (best.wins || 0) + 1;
    game.best = best;
    this.writeBest(best);
    GameRuntime.refreshBestMini();
    return newBest;
  },

  submitLeaderboard(won, game = Game) {
    if (game.test && game.test.headless) return Promise.resolve({ ok: true, skipped: 'headless' });
    if (game.fieldTestTouched || game.fieldTestRun || game.fieldTestInvincible) return Promise.resolve({ ok: true, skipped: 'field-test' });
    if (typeof Leaderboard === 'undefined') return Promise.resolve({ ok: false, skipped: 'leaderboard unavailable' });
    const entry = Leaderboard.entryFromGame(won);
    return Leaderboard.submit(entry);
  },
};
