'use strict';
// Level-up upgrade card rendering and selection.
/* ================================================================
   UI upgrade cards
   ================================================================ */
Object.assign(UI, {
  showLevelUp() {
    if (Game.levelQueue <= 0 || Game.state !== 'play') return;
    if (Game.test && Game.test.headless) { Game.state = 'levelup'; return; }
    Game.state = 'levelup';
    this.renderCards();
    showOverlay('lvOv');
  },


  updateLevelWeaponCount() {
    const el = $('lvWeaponCount');
    if (!el || !Game.player) return;
    const cap = typeof maxWeaponSlotsFor === 'function' ? maxWeaponSlotsFor(Game) : MAX_WEAPONS;
    el.textContent = tr('level.weaponCount', { count: Game.player.weapons.length, max: cap });
  },

  renderCards() {
    this.choices = UpgradeRules.generateChoices(Game);
    $('lvSub').textContent = Game.levelQueue > 1 ? tr('level.chooseMany', { count: Game.levelQueue }) : tr('level.choose');
    this.updateLevelWeaponCount();
    const wrap = $('cards');
    wrap.innerHTML = '';
    const tierInfo = levelTierInfo(Game.player ? Game.player.level : 1);
    this.choices.forEach((choice, i) => {
      const dto = UpgradeRules.describeChoice(choice, Game);
      const el = document.createElement('div');
      const neonCard = choice.kind === 'nc';
      el.className = `card tiered${dto.isNew ? ' newCard' : ''}${neonCard ? ' neonCard' : ''}`;
      el.style.setProperty('--rar', dto.color);
      el.style.setProperty('--tier', tierInfo.color);
      el.style.setProperty('--tier-bg', tierInfo.bg);
      el.style.setProperty('--tier-glow', tierInfo.glow);
      el.innerHTML = `${dto.isNew ? '<span class="newBadge">NEW</span>' : ''}<span class="tag">${dto.tag}</span><div class="ico">${dto.icon}</div>
        <div class="nm">${dto.name}</div><div class="lv">${dto.level}</div><div class="ds">${dto.description}</div>
        <span class="key">[${i + 1}]</span>`;
      el.onclick = () => this.pickCard(i);
      wrap.appendChild(el);
    });
  },

  pickCard(i) {
    if (Game.state !== 'levelup' || !this.choices[i]) return;
    const choice = this.choices[i];
    AudioFX.uiClick();
    const applied = Game.applyUpgrade(choice);
    if (applied && applied.kind === 'nc' && typeof companionBannerText === 'function') {
      const msg = companionBannerText(applied.id);
      setTimeout(() => UI.banner(msg, 'good'), 120);
    }
    Game.slotsDirty = true;
    Game.levelQueue--;
    if (Game.levelQueue > 0) this.renderCards();
    else { showOverlay(null); Game.state = 'play'; }
  },
});
