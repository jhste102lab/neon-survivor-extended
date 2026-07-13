'use strict';
// HP HUD panel rendering.
const UIHudHp = {
  reset() {
    $('hpfill').style.width = '100%';
    $('hptext').textContent = `${CFG.player.hp} / ${CFG.player.hp}`;
    const shield = $('shieldText');
    if (shield) shield.classList.add('hide');
    const shieldValue = $('shieldValue');
    const shieldFill = $('shieldFill');
    if (shieldValue) shieldValue.textContent = '0 / 0';
    if (shieldFill) shieldFill.style.width = '0%';
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
      const capacity = Math.max(value, Math.ceil(player.barrierMax || 0));
      const shieldValue = $('shieldValue');
      const shieldFill = $('shieldFill');
      if (shieldValue) shieldValue.textContent = `${value} / ${capacity}`;
      if (shieldFill) shieldFill.style.width = `${capacity > 0 ? clamp(value / capacity, 0, 1) * 100 : 0}%`;
      shield.setAttribute('aria-label', `방어막 내구도 ${value} / ${capacity}`);
      shield.classList.toggle('hide', value <= 0);
    }
  },
};
