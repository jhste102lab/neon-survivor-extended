'use strict';
// Best-record labels, leaderboard rendering, and run-detail presentation.
/* ================================================================
   UI leaderboard
   ================================================================ */
function lbEscape(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function lbWeaponName(id, evolved) {
  const table = evolved && EVOLUTIONS[id] ? EVOLUTIONS : WEAPONS;
  return table[id] && table[id].name ? table[id].name : id;
}

function lbPassiveName(id) {
  return PASSIVES[id] && PASSIVES[id].name ? PASSIVES[id].name : id;
}

function lbRows(title, rows, unit = '', labelSources = false) {
  if (!rows || !rows.length) return '';
  const label = source => labelSources && typeof SourceLabels !== 'undefined' ? SourceLabels.combatSource(source) : source;
  return `<div class="lbDetailSection"><b>${lbEscape(title)}</b>${rows.map(row => `<div><span>${lbEscape(label(row.source))}</span><em>${lbEscape(row.value)}${unit}</em></div>`).join('')}</div>`;
}

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

  leaderboardDetailHtml(entry) {
    const b = entry && entry.build;
    if (!b) return `<div class="lbDetailEmpty">No build snapshot saved for this record.</div>`;
    const weapons = (b.weapons || []).map(w => `<span class="lbPill">${lbEscape(lbWeaponName(w.id, w.evolved))} <em>${w.evolved ? 'E' : `Lv.${w.lv}`}</em></span>`).join('');
    const passives = (b.passives || []).map(x => `<span class="lbPill passive">${lbEscape(lbPassiveName(x.id))} <em>Lv.${x.lv}</em></span>`).join('');
    const drops = Object.entries(b.drops || {}).map(([k, v]) => ({ source: k, value: v })).filter(x => x.value > 0);
    const recent = (b.recentDamage || []).map(d => ({ source: `${typeof SourceLabels !== 'undefined' ? SourceLabels.damageKind(d.kind) : (d.kind || 'hit')} · ${typeof SourceLabels !== 'undefined' ? SourceLabels.combatSource(d.source) : d.source}`, value: d.damage }));
    return `
      <div class="lbDetailSummary">${lbEscape(entry.name)} · ${fmtTime(entry.time)} · Lv.${entry.level} · ${entry.kills}킬</div>
      ${b.fieldTest ? '<div class="lbDetailWarn">FIELD TEST RUN · leaderboard upload disabled</div>' : ''}
      <div class="lbDetailSection"><b>무기</b><div class="lbPills">${weapons || '<span class="lbMuted">없음</span>'}</div></div>
      <div class="lbDetailSection"><b>패시브</b><div class="lbPills">${passives || '<span class="lbMuted">없음</span>'}</div></div>
      ${lbRows('피해량 Top 5', b.damageTop, '', true)}
      ${lbRows('처치 Top 5', b.killsTop, '', true)}
      ${lbRows('회복', b.healing, '', true)}
      ${lbRows('아이템 획득', drops, '')}
      <div class="lbDetailSection"><b>사망/마지막 피격</b><div><span>${lbEscape(typeof SourceLabels !== 'undefined' ? SourceLabels.combatSource(b.lastHit || '') : (b.lastHit || 'none'))}</span><em></em></div></div>
      ${lbRows('최근 피해', recent, '')}`;
  },

  showLeaderboardDetail(entry) {
    let modal = $('leaderboardDetail');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'leaderboardDetail';
      modal.className = 'lbDetailModal hide';
      modal.innerHTML = '<div class="lbDetailPanel"><button class="lbDetailClose" type="button">×</button><h3></h3><div class="lbDetailBody"></div></div>';
      document.body.appendChild(modal);
      modal.addEventListener('click', event => { if (event.target === modal || event.target.classList.contains('lbDetailClose')) modal.classList.add('hide'); });
    }
    modal.querySelector('h3').textContent = tr('leaderboard.detailsTitle');
    modal.querySelector('.lbDetailBody').innerHTML = this.leaderboardDetailHtml(entry);
    modal.classList.remove('hide');
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
    if (Leaderboard.source !== 'global' && Leaderboard.fallbackReason) {
      const warn = document.createElement('div');
      warn.className = 'lbWarn';
      warn.textContent = tr('leaderboard.fallback', { reason: Leaderboard.fallbackReason });
      el.appendChild(warn);
    }
    if (opts.message) {
      const msg = document.createElement('div');
      msg.className = 'lbEmpty';
      msg.textContent = opts.message;
      el.appendChild(msg);
      return;
    }
    const entries = Leaderboard.entries || [];
    const highlightRunId = opts.highlightRunId || Leaderboard.highlightRunId || '';
    const highlightName = opts.highlightName || Leaderboard.highlightName || '';
    if (!entries.length) {
      const empty = document.createElement('div');
      empty.className = 'lbEmpty';
      empty.textContent = Leaderboard.source === 'global' ? tr('leaderboard.emptyGlobal') : tr('leaderboard.emptyLocal');
      el.appendChild(empty);
      return;
    }
    const hint = document.createElement('div');
    hint.className = 'lbHint';
    hint.textContent = tr('leaderboard.detailsHint');
    el.appendChild(hint);
    entries.slice(0, Leaderboard.publicLimit).forEach((e, i) => {
      const row = document.createElement('div');
      row.className = 'lbRow';
      row.tabIndex = 0;
      row.setAttribute('role', 'button');
      const isMine = !!((highlightRunId && e.runId === highlightRunId) || (!highlightRunId && highlightName && e.name === highlightName));
      row.classList.toggle('me', isMine);
      const rank = document.createElement('span');
      rank.className = 'lbRank';
      rank.textContent = `#${i + 1}`;
      const name = document.createElement('span');
      name.className = 'lbName';
      name.textContent = e.name;
      if (isMine) name.setAttribute('title', `#${i + 1}`);
      const stat = document.createElement('span');
      stat.className = 'lbStat';
      stat.textContent = tr('leaderboard.stat', { time: fmtTime(e.time), kills: e.kills, level: e.level, combo: e.maxCombo || 0 });
      row.append(rank, name, stat);
      row.addEventListener('click', () => this.showLeaderboardDetail(e));
      row.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); this.showLeaderboardDetail(e); } });
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
