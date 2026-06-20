'use strict';
// Best-record labels and leaderboard rendering only; submission orchestration lives in leaderboard-controller.js.
/* ================================================================
   UI leaderboard
   ================================================================ */
Object.assign(UI, {
  refreshBestMini() {
    const b = Game.best;
    $('bestMini').textContent = b.time > 0 ? tr('leaderboard.bestMini', { time: fmtTime(b.time), combo: b.maxCombo || 0 }) : '';
  },

  refreshTitleBest() {
    const b = Game.best;
    $('bestLine').innerHTML = b.time > 0
      ? tr('leaderboard.bestLine', { time: fmtTime(b.time), kills: b.kills, level: b.level, combo: b.maxCombo || 0, wins: b.wins ? tr('leaderboard.wins', { wins: b.wins }) : '' })
      : tr('leaderboard.welcome');
  },

  renderLeaderboard(targetId = 'titleLeaderboard', opts = {}) {
    if (Game.test && Game.test.headless) return;
    if (typeof Leaderboard === 'undefined') return;
    const el = $(targetId);
    if (!el) return;
    el.innerHTML = '';
    const head = document.createElement('div');
    head.className = 'lbHead';
    const title = document.createElement('span');
    title.textContent = tr('leaderboard.title');
    const badge = document.createElement('em');
    badge.textContent = Leaderboard.source === 'global' ? 'GLOBAL' : 'LOCAL';
    head.append(title, badge);
    el.appendChild(head);
    if (opts.message) {
      const msg = document.createElement('div');
      msg.className = 'lbEmpty';
      msg.textContent = opts.message;
      el.appendChild(msg);
      return;
    }
    const entries = Leaderboard.entries || [];
    if (!entries.length) {
      const empty = document.createElement('div');
      empty.className = 'lbEmpty';
      empty.textContent = Leaderboard.source === 'global' ? tr('leaderboard.emptyGlobal') : tr('leaderboard.emptyLocal');
      el.appendChild(empty);
      return;
    }
    entries.slice(0, Leaderboard.publicLimit).forEach((e, i) => {
      const row = document.createElement('div');
      row.className = 'lbRow';
      const rank = document.createElement('span');
      rank.className = 'lbRank';
      rank.textContent = `#${i + 1}`;
      const name = document.createElement('span');
      name.className = 'lbName';
      name.textContent = e.name;
      const stat = document.createElement('span');
      stat.className = 'lbStat';
      stat.textContent = tr('leaderboard.stat', { time: fmtTime(e.time), kills: e.kills, level: e.level, combo: e.maxCombo || 0 });
      row.append(rank, name, stat);
      el.appendChild(row);
    });
  },

  refreshLeaderboard() {
    if (Game.test && Game.test.headless) return Promise.resolve([]);
    if (typeof Leaderboard === 'undefined') return Promise.resolve([]);
    this.renderLeaderboard('titleLeaderboard', { message: tr('leaderboard.loading') });
    return Leaderboard.load().then(entries => {
      this.renderLeaderboard('titleLeaderboard');
      return entries;
    });
  },
});
