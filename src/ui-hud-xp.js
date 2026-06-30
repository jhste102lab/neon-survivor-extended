'use strict';
// XP HUD panel rendering.
const UIHudXp = {
  reset() {
    $('xpfill').style.width = '0%';
    const debtFill = $('xpdebtfill');
    if (debtFill) debtFill.style.width = '0%';
    const debt = $('xpdebt');
    if (debt) debt.classList.add('hide');
  },

  update(player) {
    $('xpfill').style.width = clamp(player.xp / player.xpNeed * 100, 0, 100) + '%';
    const debtFill = $('xpdebtfill');
    if (debtFill) debtFill.style.width = clamp((player.xpDebt || 0) / Math.max(1, player.xpNeed || 1) * 100, 0, 100) + '%';
    const debt = $('xpdebt');
    if (!debt) return;
    const value = Math.ceil(player.xpDebt || 0);
    debt.textContent = value > 0 ? tr('hud.xpDebt', { value }) : '';
    debt.classList.toggle('hide', value <= 0);
    debt.classList.toggle('warn', value > 0 && value >= Math.round((player.xpNeed || 1) * 0.8));
  },
};
