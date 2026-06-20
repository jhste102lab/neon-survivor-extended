'use strict';
// Remote leaderboard enablement, session, and network adapter.
const LeaderboardRemote = {
  sessionPath: '/api/session',

  sessionPathForApi(apiPath) {
    if (typeof window !== 'undefined' && typeof window.NS_LEADERBOARD_SESSION_API === 'string' && window.NS_LEADERBOARD_SESSION_API) {
      return window.NS_LEADERBOARD_SESSION_API;
    }
    try {
      const url = new URL(apiPath, location.href);
      url.pathname = url.pathname.replace(/\/api\/leaderboard\/?$/, '/api/session');
      return url.href;
    } catch (e) {
      return this.sessionPath;
    }
  },

  enabled(state) {
    if (typeof window === 'undefined' || typeof location === 'undefined' || location.protocol === 'file:') return false;
    if (typeof window.NS_LEADERBOARD_API === 'string' && window.NS_LEADERBOARD_API) {
      state.apiPath = window.NS_LEADERBOARD_API;
      this.sessionPath = this.sessionPathForApi(state.apiPath);
      return true;
    }
    try {
      if (new URLSearchParams(location.search).get('remoteLb') === '1') return true;
    } catch (e) {}
    if (window.NS_ENABLE_REMOTE_LEADERBOARD === true) return true;
    const host = location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '') return false;
    if (host.endsWith('github.io')) return false;
    return location.protocol === 'https:' || host.endsWith('.pages.dev') || host.endsWith('.workers.dev');
  },

  async beginRun(state, runId) {
    state.activeRunId = runId || '';
    state.activeProof = '';
    state.pendingSessionRunId = state.activeRunId;
    const seq = (state.sessionSeq || 0) + 1;
    state.sessionSeq = seq;
    const game = typeof Game !== 'undefined' ? Game : null;
    if (!this.enabled(state) || (game && game.test && game.test.headless)) return null;
    const sessionPath = this.sessionPathForApi(state.apiPath || '/api/leaderboard');
    const pending = (async () => {
      try {
        const requestRunId = state.pendingSessionRunId;
        const res = await fetch(sessionPath, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ runId: requestRunId, name: Profile.ensureName() }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data || !data.runId || !data.proof) throw new Error('bad session');
        if (seq !== state.sessionSeq || state.pendingSessionRunId !== requestRunId) return null;
        state.activeRunId = String(data.runId);
        state.activeProof = String(data.proof);
        if (game && game.runId === runId) {
          game.runId = state.activeRunId;
          game.runProof = state.activeProof;
        }
        return data;
      } catch (e) {
        if (seq === state.sessionSeq) state.fallbackReason = e && e.message ? e.message : 'session unavailable';
        return null;
      }
    })();
    state.pendingSessionPromise = pending;
    return pending;
  },

  async waitForProof(state, runId, timeoutMs = 800) {
    if (state.activeProof && (!runId || state.activeRunId === runId)) return state.activeProof;
    const pending = state.pendingSessionPromise;
    if (!pending) return '';
    const timer = new Promise(resolve => setTimeout(() => resolve(null), timeoutMs));
    await Promise.race([pending, timer]);
    return state.activeProof && (!runId || state.activeRunId === runId) ? state.activeProof : '';
  },

  async loadEntries(apiPath) {
    const res = await fetch(apiPath, { headers: { Accept: 'application/json' }, cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.entries)) throw new Error('bad payload');
    return data.entries;
  },

  async submitEntry(apiPath, payload) {
    const res = await fetch(apiPath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.entries)) throw new Error('bad payload');
    return data.entries;
  },
};
