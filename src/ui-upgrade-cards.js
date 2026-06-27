'use strict';
// Level-up upgrade card rendering and selection.
/* ================================================================
   UI upgrade cards
   ================================================================ */
function upgradeCardEscape(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

Object.assign(UI, {
  setLevelOverlayCopy(titleKey = 'level.title', subText = null) {
    const title = document.querySelector('#lvOv .ovtitle');
    if (title) title.textContent = tr(titleKey);
    const sub = $('lvSub');
    if (sub) sub.textContent = subText == null ? tr('level.choose') : subText;
  },

  showLevelUp() {
    if (Game.levelQueue <= 0 || Game.state !== 'play') return;
    if (Game.test && Game.test.headless) { Game.state = 'levelup'; return; }
    this.rewardCardMode = false;
    Game.state = 'levelup';
    this.setLevelOverlayCopy('level.title');
    this.renderCards();
    showOverlay('lvOv');
  },

  showRewardCard(choice, sourceLabel = '') {
    if (!choice) return;
    this.rewardCardMode = true;
    this.choices = [choice];
    Game.state = 'levelup';
    const sub = sourceLabel ? tr('event.rewardChooseNamed', { name: sourceLabel }) : tr('event.rewardChoose');
    this.setLevelOverlayCopy('event.rewardTitle', sub);
    this.renderChoiceCards(this.choices);
    showOverlay('lvOv');
  },

  updateLevelWeaponCount() {
    const el = $('lvWeaponCount');
    if (!el || !Game.player) return;
    const cap = typeof maxWeaponSlotsFor === 'function' ? maxWeaponSlotsFor(Game) : MAX_WEAPONS;
    el.textContent = tr('level.weaponCount', { count: Game.player.weapons.length, max: cap });
  },

  renderCards() {
    this.rewardCardMode = false;
    this.choices = UpgradeRules.generateChoices(Game);
    $('lvSub').textContent = Game.levelQueue > 1 ? tr('level.chooseMany', { count: Game.levelQueue }) : tr('level.choose');
    this.updateLevelWeaponCount();
    this.renderChoiceCards(this.choices);
  },

  renderChoiceCards(choices) {
    this.updateLevelWeaponCount();
    const wrap = $('cards');
    wrap.innerHTML = '';
    wrap.classList.toggle('singleCard', choices.length === 1);
    const tierInfo = levelTierInfo(Game.player ? Game.player.level : 1);
    choices.forEach((choice, i) => {
      const dto = UpgradeRules.describeChoice(choice, Game);
      const el = document.createElement('div');
      const neonCard = choice.kind === 'nc';
      el.className = `card tiered${dto.isNew ? ' newCard' : ''}${neonCard ? ' neonCard' : ''}`;
      el.style.setProperty('--rar', dto.color);
      el.style.setProperty('--tier', tierInfo.color);
      el.style.setProperty('--tier-bg', tierInfo.bg);
      el.style.setProperty('--tier-glow', tierInfo.glow);
      const detail = dto.details && dto.details.length ? `<div class="cardDetails">${dto.details.map(line => `<div>${upgradeCardEscape(line)}</div>`).join('')}</div>` : '';
      el.innerHTML = `${dto.isNew ? '<span class="newBadge">NEW</span>' : ''}<span class="tag">${dto.tag}</span><div class="ico">${dto.icon}</div>
        <div class="nm">${upgradeCardEscape(dto.name)}</div><div class="lv">${upgradeCardEscape(dto.level)}</div><div class="ds">${upgradeCardEscape(dto.description)}</div>${detail}
        <span class="key">[${i + 1}]</span>`;
      el.onclick = () => this.pickCard(i);
      wrap.appendChild(el);
    });
  },

  pickCard(i) {
    if (Game.state !== 'levelup' || !this.choices[i]) return;
    const choice = this.choices[i];
    const rewardMode = !!this.rewardCardMode;
    AudioFX.uiClick();
    const applied = Game.applyUpgrade(choice);
    if (applied && applied.kind === 'nc' && typeof companionBannerText === 'function') {
      const msg = companionBannerText(applied.id);
      setTimeout(() => UI.banner(msg, 'good'), 120);
    }
    Game.slotsDirty = true;
    if (rewardMode) {
      this.rewardCardMode = false;
      showOverlay(null);
      Game.state = 'play';
      if (Game.levelQueue > 0) GameRuntime.scheduleLevelUpPrompt(Game, 80);
      return;
    }
    Game.levelQueue--;
    if (Game.levelQueue > 0) this.renderCards();
    else { showOverlay(null); Game.state = 'play'; }
  },
});
