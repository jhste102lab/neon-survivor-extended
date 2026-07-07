'use strict';
// HP HUD panel rendering.
const UIHudHp = {
  reset() {
    $('hpfill').style.width = '100%';
    $('hptext').textContent = `${CFG.player.hp} / ${CFG.player.hp}`;
    const shield = $('shieldText');
    if (shield) shield.classList.add('hide');
  },

  update(player, stats) {
    const hpRatio = clamp(player.hp / stats.maxHp, 0, 1);
    const fill = $('hpfill');
    fill.style.width = (hpRatio * 100) + '%';
    fill.className = hpRatio < 0.25 ? 'low' : hpRatio < 0.55 ? 'mid' : '';
    $('hptext').textContent = `${Math.ceil(player.hp)} / ${stats.maxHp}`;
    const shield = $('shieldText');
    if (shield) {
      const value = Math.floor(player.barrier || 0);
      shield.textContent = `🛡 ${value}`;
      shield.classList.toggle('hide', value <= 0);
    }
  },
};
