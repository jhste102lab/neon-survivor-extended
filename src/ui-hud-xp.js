'use strict';
// XP HUD panel rendering.
const UIHudXp = {
  reset() {
    $('xpfill').style.width = '0%';
    const debt = $('xpdebt');
    if (debt) debt.classList.add('hide');
  },

  update(player) {
    $('xpfill').style.width = clamp(player.xp / player.xpNeed * 100, 0, 100) + '%';
    const debt = $('xpdebt');
    if (!debt) return;
    const value = Math.ceil(player.xpDebt || 0);
    debt.textContent = value > 0 ? tr('hud.xpDebt', { value }) : '';
    debt.classList.toggle('hide', value <= 0);
  },
};
