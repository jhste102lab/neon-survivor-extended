'use strict';
// Pre-run custom settings. These affect gameplay and are recorded in leaderboard snapshots.
const RunSettings = {
  key: 'ns_run_settings_v1',
  defaults: Object.freeze({ weaponCap: 'default', enemyMode: 'default', slotHudCollapsed: false }),
  weaponCapOptions: Object.freeze(['default', '60pct']),
  enemyModeOptions: Object.freeze(['default', 'half']),

  normalize(raw = {}) {
    const merged = { ...this.defaults, ...(raw && typeof raw === 'object' ? raw : {}) };
    const weaponCap = this.weaponCapOptions.includes(String(merged.weaponCap)) ? String(merged.weaponCap) : this.defaults.weaponCap;
    const enemyMode = this.enemyModeOptions.includes(String(merged.enemyMode)) ? String(merged.enemyMode) : this.defaults.enemyMode;
    return { weaponCap, enemyMode, slotHudCollapsed: !!merged.slotHudCollapsed };
  },

  load() {
    try { return this.normalize(JSON.parse(localStorage.getItem(this.key) || 'null')); }
    catch (e) { this.lastError = e && e.message ? e.message : 'storage unavailable'; return this.normalize(); }
  },

  save(settings) {
    const normalized = this.normalize(settings);
    try { localStorage.setItem(this.key, JSON.stringify(normalized)); }
    catch (e) { this.lastError = e && e.message ? e.message : 'storage unavailable'; }
    return normalized;
  },

  snapshotForRun() {
    const s = this.load();
    return {
      weaponCap: s.weaponCap,
      enemyMode: s.enemyMode,
      enemyDensity: s.enemyMode === 'half' ? 0.5 : 1,
      enemyStatMul: s.enemyMode === 'half' ? 1.8 : 1,
      weaponCapBonusCount: 0,
      weaponCapBonusDamage: 0,
      weaponCapBonusThresholds: [],
      weaponCapResolved: this.resolveWeaponCap(s.weaponCap),
    };
  },

  selectedWeaponCap(game) {
    const cap = String(game && game.runSettings && game.runSettings.weaponCap || 'default');
    if (cap === 'default') return ENDLESS_MAX_WEAPONS;
    return game && game.runSettings && game.runSettings.weaponCapResolved || this.resolveWeaponCap(cap);
  },

  resolveWeaponCap(cap) {
    if (cap !== '60pct') return ENDLESS_MAX_WEAPONS;
    return clamp(Math.floor(Object.keys(WEAPONS).length * 0.6), MAX_WEAPONS, ENDLESS_MAX_WEAPONS);
  },

  enemyDensity(game) {
    return game && game.runSettings && game.runSettings.enemyMode === 'half' ? 0.5 : 1;
  },

  enemyStatMul(game) {
    return game && game.runSettings && game.runSettings.enemyMode === 'half' ? 1.8 : 1;
  },

  isCustom(settings) {
    const s = this.normalize(settings);
    return s.weaponCap !== 'default' || s.enemyMode !== 'default';
  },

  competitiveLabel(settings) {
    const s = this.normalize(settings);
    const parts = [];
    if (s.weaponCap !== 'default') parts.push(`무기${s.weaponCap === 'all' ? 'ALL' : s.weaponCap}`);
    if (s.enemyMode === 'half') parts.push('몹50');
    return parts.join(' · ') || '기본';
  },

  render(container) {
    if (!container) return;
    const s = this.load();
    container.innerHTML = `
      <details class="runSettingsDetails" open>
        <summary>런 설정 <em>${this.competitiveLabel(s)}</em></summary>
        <div class="runSettingGroup">
          <b>최대 무기 수</b>
          <div class="runSettingChoices" data-run-setting="weaponCap">
            ${this.weaponCapOptions.map(value => `<button type="button" class="runSettingChip${s.weaponCap === value ? ' active' : ''}" data-value="${value}">${this.weaponCapLabel(value)}</button>`).join('')}
          </div>
          <p>60% 제한은 현재 ${Object.keys(WEAPONS).length}종 중 최대 ${this.resolveWeaponCap('60pct')}개입니다. 진화는 새 무기로 세지 않습니다.</p>
        </div>
        <div class="runSettingGroup">
          <b>몹 밀도</b>
          <div class="runSettingChoices" data-run-setting="enemyMode">
            <button type="button" class="runSettingChip${s.enemyMode === 'default' ? ' active' : ''}" data-value="default">기본</button>
            <button type="button" class="runSettingChip${s.enemyMode === 'half' ? ' active' : ''}" data-value="half">절반 · 스탯 1.8배</button>
          </div>
          <p>몹 수를 줄이는 대신 일반 적의 체력/공격력이 강해집니다. 랭킹에 표시됩니다.</p>
        </div>
      </details>`;
    container.querySelectorAll('[data-run-setting] .runSettingChip').forEach(btn => {
      btn.addEventListener('click', () => {
        const next = this.load();
        next[btn.parentElement.dataset.runSetting] = btn.dataset.value;
        this.save(next);
        this.render(container);
      });
    });
  },

  weaponCapLabel(value) {
    return ({ default: '기본', '60pct': `60% · ${this.resolveWeaponCap('60pct')}개` })[value] || value;
  },

  initDom() {
    this.render(typeof $ === 'function' ? $('runSettingsBox') : null);
  },
};

globalThis.RunSettings = RunSettings;
