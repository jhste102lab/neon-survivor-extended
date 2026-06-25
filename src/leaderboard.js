'use strict';
// Leaderboard facade and state/load-submit orchestration.
const Leaderboard = {
  apiPath: '/api/leaderboard',
  localKey: `ns_leaderboard_${LEADERBOARD_CONTRACT.ruleset}`,
  contract: LEADERBOARD_CONTRACT,
  publicLimit: 10,
  storageLimit: 25,
  entries: [],
  source: 'local',
  fallbackReason: '',
  activeRunId: '',
  activeProof: '',
  highlightRunId: '',
  highlightName: '',
  sessionSeq: 0,
  pendingSessionRunId: '',
  pendingSessionPromise: null,

  remoteEnabled() {
    return LeaderboardRemote.enabled(this);
  },

  beginRun(runId) {
    return LeaderboardRemote.beginRun(this, runId);
  },

  cleanName(name) {
    return LeaderboardEntry.cleanName(name);
  },

  num(v, min, max, fallback = 0) {
    return LeaderboardEntry.num(v, min, max, fallback);
  },

  normalizeEntry(raw) {
    return LeaderboardEntry.normalizeEntry(raw);
  },

  compare(a, b) {
    return LeaderboardEntry.compare(a, b);
  },

  upsert(entries, entry, limit = this.storageLimit) {
    return LeaderboardEntry.upsert(entries, entry, limit);
  },

  readLocal() {
    return LeaderboardLocal.read(this.localKey, this.storageLimit);
  },

  writeLocal(entries) {
    LeaderboardLocal.write(this.localKey, entries, this.storageLimit);
  },

  async load() {
    if (!this.remoteEnabled()) {
      this.entries = this.readLocal().slice(0, this.publicLimit);
      this.source = 'local';
      this.fallbackReason = 'remote disabled for static hosting';
      return this.entries;
    }
    try {
      const entries = await LeaderboardRemote.loadEntries(this.apiPath);
      this.entries = LeaderboardEntry.normalizeList(entries, this.publicLimit);
      this.source = 'global';
      this.fallbackReason = '';
      return this.entries;
    } catch (e) {
      this.entries = this.readLocal().slice(0, this.publicLimit);
      this.source = 'local';
      this.fallbackReason = LeaderboardRemote.publicFallbackReason(e);
      return this.entries;
    }
  },

  entryFromGame(won) {
    return LeaderboardEntry.entryFromGame(won, this.activeProof);
  },

  async submit(entry) {
    const normalized = this.normalizeEntry(entry);
    if (!normalized) return { ok: false, source: this.source, error: 'invalid entry' };
    this.highlightRunId = normalized.runId;
    this.highlightName = normalized.name;

    const local = this.upsert(this.readLocal(), normalized);
    this.writeLocal(local);
    this.entries = local.slice(0, this.publicLimit);
    this.source = 'local';

    if (!this.remoteEnabled()) return { ok: true, source: 'local' };

    try {
      const game = typeof Game !== 'undefined' ? Game : null;
      const proof = entry.proof || (game && game.runProof) || await LeaderboardRemote.waitForProof(this, normalized.runId, 900);
      if (!proof) throw new Error('session unavailable');
      const payload = { ...normalized, proof };
      const entries = await LeaderboardRemote.submitEntry(this.apiPath, payload);
      this.entries = LeaderboardEntry.normalizeList(entries, this.publicLimit);
      this.source = 'global';
      this.fallbackReason = '';
      return { ok: true, source: 'global' };
    } catch (e) {
      this.fallbackReason = LeaderboardRemote.publicFallbackReason(e);
      return { ok: true, source: 'local', warning: this.fallbackReason, warningKind: e && e.leaderboardKind || 'unknown' };
    }
  },
};
