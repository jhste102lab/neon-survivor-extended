'use strict';
// Remote leaderboard enablement, session, network adapter, and public fallback classification.
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

  classifyResponseError(status, payload = null) {
    const serverCode = payload && payload.error ? String(payload.error) : `http_${status}`;
    if (status === 400 || status === 403 || status === 422) return { kind: 'contract_rejected', message: `contract rejected: ${serverCode}`, serverCode, status };
    if (status === 409) return { kind: 'duplicate_or_conflict', message: `submission conflict: ${serverCode}`, serverCode, status };
    if (status === 429) return { kind: 'rate_limited', message: 'rate limited by remote leaderboard', serverCode, status };
    if (status >= 500) return { kind: 'remote_unavailable', message: `remote leaderboard unavailable: HTTP ${status}`, serverCode, status };
    return { kind: 'bad_remote_response', message: `unexpected leaderboard response: HTTP ${status}`, serverCode, status };
  },

  errorFromClassification(classification) {
    const err = new Error(classification.message);
    err.leaderboardKind = classification.kind;
    err.serverCode = classification.serverCode;
    err.status = classification.status;
    return err;
  },

  networkError(error) {
    const err = new Error(error && error.message ? `network unavailable: ${error.message}` : 'network unavailable');
    err.leaderboardKind = 'network_unavailable';
    return err;
  },

  async readJsonResponse(res) {
    try { return await res.json(); }
    catch (e) { return null; }
  },

  async requestJson(url, options = {}) {
    let res;
    try {
      res = await fetch(url, options);
    } catch (e) {
      throw this.networkError(e);
    }
    const data = await this.readJsonResponse(res);
    if (!res.ok) throw this.errorFromClassification(this.classifyResponseError(res.status, data));
    return data;
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
        const data = await this.requestJson(sessionPath, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ runId: requestRunId, name: Profile.ensureName() }),
        });
        if (!data || !data.runId || !data.proof) throw this.errorFromClassification({ kind: 'bad_remote_response', message: 'bad session payload', serverCode: 'bad_session_payload', status: 0 });
        if (seq !== state.sessionSeq || state.pendingSessionRunId !== requestRunId) return null;
        state.activeRunId = String(data.runId);
        state.activeProof = String(data.proof);
        if (game && game.runId === runId) {
          game.runId = state.activeRunId;
          game.runProof = state.activeProof;
        }
        return data;
      } catch (e) {
        if (seq === state.sessionSeq) state.fallbackReason = this.publicFallbackReason(e);
        return null;
      }
    })();
    state.pendingSessionPromise = pending;
    return pending;
  },

  publicFallbackReason(error) {
    if (!error) return 'remote unavailable';
    if (error.leaderboardKind) return error.message;
    return error.message || 'remote unavailable';
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
    const data = await this.requestJson(apiPath, { headers: { Accept: 'application/json' }, cache: 'no-store' });
    if (!Array.isArray(data.entries)) throw this.errorFromClassification({ kind: 'bad_remote_response', message: 'bad leaderboard payload', serverCode: 'bad_payload', status: 0 });
    return data.entries;
  },

  async submitEntry(apiPath, payload) {
    const data = await this.requestJson(apiPath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!Array.isArray(data.entries)) throw this.errorFromClassification({ kind: 'bad_remote_response', message: 'bad leaderboard payload', serverCode: 'bad_payload', status: 0 });
    return data.entries;
  },
};
