'use strict';
// 적 도감 오버레이.
function bestiaryEscape(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

const UIBestiary = {
  tab: 'normal',
  selected: '',

  open(tab = this.tab) {
    this.tab = tab;
    this.selected = '';
    this.render();
    showOverlay('bestiaryOv');
  },

  close() {
    showOverlay(Game.state === 'pause' ? 'pauseOv' : Game.state === 'title' ? 'titleOv' : null);
  },

  entryVisual(entry) {
    if (entry.ref && entry.ref.startsWith('enemy:')) {
      const type = entry.ref.slice(6);
      const def = ENEMY_TYPES[type];
      if (def) return { shape: def.shape, color: def.color, r: def.r };
    }
    if (entry.ref && entry.ref.startsWith('boss:')) {
      const key = entry.ref.slice(5);
      const boss = key === 'gatekeeper' && typeof DIMENSION_GATEKEEPER !== 'undefined' ? DIMENSION_GATEKEEPER : BOSSES[Number(key)];
      if (boss) return { shape: boss.shape, color: boss.color, r: boss.r };
    }
    if (entry.ref && entry.ref.startsWith('dimension:') && typeof DIMENSIONS !== 'undefined') {
      const def = DIMENSIONS.find(d => d.id === entry.ref.slice(10));
      if (def) return { icon: def.icon, color: def.color };
    }
    return { icon: entry.icon || '◆', color: '#41f0ff' };
  },

  renderPreview(canvas, entry) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const visual = this.entryVisual(entry);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = visual.color || '#41f0ff';
    ctx.lineWidth = 2;
    for (let r = 20; r <= 48; r += 14) { ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke(); }
    ctx.globalAlpha = 1;
    if (visual.shape && typeof Sprites !== 'undefined') {
      const size = Math.max(26, Math.min(62, (visual.r || 16) * 2.1));
      const sprite = Sprites.shape(visual.shape, visual.color, size / 2);
      ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
    } else {
      ctx.font = '36px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(visual.icon || '◆', 0, 1);
    }
    ctx.restore();
  },

  entriesForTab() {
    return BESTIARY_ENTRIES.filter(entry => entry.tab === this.tab);
  },

  currentEntry() {
    const entries = this.entriesForTab();
    return entries.find(entry => entry.title === this.selected) || entries[0] || null;
  },

  render() {
    const tabs = $('bestiaryTabs');
    const grid = $('bestiaryGrid');
    if (!tabs || !grid) return;
    tabs.innerHTML = BESTIARY_TABS.map(tab => `<button class="bestiaryTab${tab.id === this.tab ? ' active' : ''}" data-tab="${tab.id}" type="button">${bestiaryEscape(tab.name)}</button>`).join('');
    tabs.querySelectorAll('[data-tab]').forEach(btn => btn.addEventListener('click', () => { this.tab = btn.dataset.tab; this.selected = ''; this.render(); }));

    const entries = this.entriesForTab();
    const selected = this.currentEntry();
    if (selected) this.selected = selected.title;
    grid.innerHTML = entries.map((entry, index) => `<button class="bestiaryCard${entry.title === this.selected ? ' active' : ''}" data-index="${index}" type="button">
      <canvas width="86" height="74" aria-hidden="true"></canvas>
      <b>${bestiaryEscape(entry.title)}</b>
      <span>${bestiaryEscape(entry.role)}</span>
      <em>위험도 ${bestiaryEscape(entry.danger)}</em>
    </button>`).join('');
    grid.querySelectorAll('.bestiaryCard').forEach((btn, index) => {
      this.renderPreview(btn.querySelector('canvas'), entries[index]);
      btn.addEventListener('click', () => { this.selected = entries[index].title; this.render(); });
    });
    this.renderDetail(selected);
  },



  statRows(entry) {
    if (!entry || !entry.ref) return [];
    if (entry.ref.startsWith('enemy:')) {
      const def = ENEMY_TYPES[entry.ref.slice(6)];
      if (!def) return [];
      return [['체력', def.hp], ['공격력', def.dmg], ['속도', def.spd], ['반경', def.r], ['관통저항', '해당 없음'], ['방어력', '해당 없음']];
    }
    if (entry.ref.startsWith('boss:')) {
      const key = entry.ref.slice(5);
      const boss = key === 'gatekeeper' && typeof DIMENSION_GATEKEEPER !== 'undefined' ? DIMENSION_GATEKEEPER : BOSSES[Number(key)];
      if (!boss) return [];
      const patterns = [boss.ring ? '탄막' : '', boss.dash ? '대시' : '', boss.summon ? '소환' : '', boss.trap || boss.mega ? '장판' : '', boss.laneTrap || boss.mega ? '레이저/차선' : ''].filter(Boolean).join(', ') || '접근';
      return [['체력', boss.hp], ['공격력', boss.dmg], ['속도', boss.spd], ['반경', boss.r], ['주요 패턴', patterns], ['관통저항', '해당 없음']];
    }
    if (entry.ref.startsWith('dimension:') && typeof DIMENSIONS !== 'undefined') {
      const def = DIMENSIONS.find(d => d.id === entry.ref.slice(10));
      if (!def) return [];
      const relic = typeof DIMENSION_RELICS !== 'undefined' ? DIMENSION_RELICS[def.relic] : null;
      return [['목표', def.goal], ['위험도', '★'.repeat(def.danger || 1)], ['고정 유물', relic ? `${relic.icon} ${relic.name}` : '없음'], ['권장 완료', '게임 시간 120~180초'], ['실패 조건', '체력 0 → 붕괴 탈출']];
    }
    return [];
  },

  renderDetail(entry) {
    const detail = $('bestiaryDetail');
    if (!detail || !entry) return;
    detail.innerHTML = `<div class="bestiaryScan"><canvas width="140" height="110" aria-hidden="true"></canvas></div>
      <h3>${bestiaryEscape(entry.title)}</h3>
      <p class="bestiaryRole">${bestiaryEscape(entry.role)} · 위험도 ${bestiaryEscape(entry.danger)}</p>
      <dl>
        <dt>등장 시점</dt><dd>${bestiaryEscape(entry.appears)}</dd>
        ${this.statRows(entry).length ? `<dt>실제 수치</dt><dd>${this.statRows(entry).map(row => `${bestiaryEscape(row[0])}: ${bestiaryEscape(row[1])}`).join(' · ')}</dd>` : ''}
        <dt>행동</dt><dd>${bestiaryEscape(entry.behavior)}</dd>
        <dt>주요 위험</dt><dd>${bestiaryEscape(entry.risk)}</dd>
        <dt>대응법</dt><dd>${bestiaryEscape(entry.tip)}</dd>
      </dl>`;
    this.renderPreview(detail.querySelector('canvas'), entry);
  },
};

Object.assign(UI, {
  openBestiary(tab) { UIBestiary.open(tab || 'normal'); },
  closeBestiary() { UIBestiary.close(); },
});
