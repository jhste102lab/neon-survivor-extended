'use strict';
// HP HUD panel rendering.
const UIHudHp = {
  reset() {
    $('hpfill').style.width = '100%';
    $('hptext').textContent = `${CFG.player.hp} / ${CFG.player.hp}`;
  },

  update(player, stats) {
    const hpRatio = clamp(player.hp / stats.maxHp, 0, 1);
    const fill = $('hpfill');
    fill.style.width = (hpRatio * 100) + '%';
    fill.className = hpRatio < 0.25 ? 'low' : hpRatio < 0.55 ? 'mid' : '';
    $('hptext').textContent = `${Math.ceil(player.hp)} / ${stats.maxHp}`;
  },
};
