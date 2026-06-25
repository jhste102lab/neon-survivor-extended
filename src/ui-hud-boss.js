'use strict';
// Boss health bar rendering.
const UIHudBoss = {
  updateDashHud(game = Game) {
    if (Game.test && Game.test.headless) return;
    const wrap = $('dashHud'), ring = $('dashMeterRing'), text = $('dashMeterText'), count = $('dashCount'), slots = $('dashSlots');
    if (!wrap || !ring || !text || !count || !slots || !game.player) return;
    const p = game.player;
    const max = typeof game.dashMaxChargesAtTime === 'function' ? game.dashMaxChargesAtTime(game.time) : (CFG.dash.maxCharges || 2);
    const charges = Math.max(0, Math.min(max, Math.floor(Number(p.dashCharges || 0))));
    const recharge = Math.max(0.001, Number((CFG.dash && CFG.dash.recharge) || 4.8));
    const progress = charges >= max ? 1 : clamp(1 - (Number(p.dashRechargeT || 0) / recharge), 0, 1);
    const circumference = 2 * Math.PI * 24;
    ring.style.strokeDasharray = `${circumference}`;
    ring.style.strokeDashoffset = `${circumference * (1 - progress)}`;
    slots.innerHTML = Array.from({ length: max }, (_, i) => `<i class="${i < charges ? 'on' : (i === charges ? 'next' : '')}"></i>`).join('');
    wrap.classList.toggle('active', p.dashActiveT > 0);
    wrap.classList.toggle('ready', charges >= max);
    count.textContent = `${charges} / ${max}`;
    text.textContent = charges >= max ? tr('hud.dashReady') : `${Math.max(0.1, Number(p.dashRechargeT || 0)).toFixed(1)}s`;
  },

  updateFocusChip(game = Game) {
    if (Game.test && Game.test.headless) return;
    const btn = $('btnFocusMode');
    if (!btn || !game.player) return;
    const canRecall = typeof game.hasScoutPickupRecall === 'function' && game.hasScoutPickupRecall();
    const focusedCount = typeof game.focusedPickupCount === 'function' ? game.focusedPickupCount() : 0;
    const recallReady = !!(canRecall && focusedCount > 0 && game.focusMode);
    const active = !!game.focusMode;
    btn.classList.toggle('active', active);
    btn.classList.toggle('recall', active && canRecall);
    btn.classList.toggle('recallReady', recallReady);
    btn.textContent = active
      ? (recallReady ? tr('hud.focusRecallReady', { count: focusedCount }) : (canRecall ? tr('hud.focusRecall') : tr('hud.focusOn')))
      : tr('hud.focusOff');
  },

  showBossBar(name) {
    if (Game.test && Game.test.headless) return;
    $('bossname').textContent = name;
    $('bossfill').style.width = '100%';
    $('bosswrap').classList.add('on');
  },

  updateBossBar(enemy) {
    if (Game.test && Game.test.headless) return;
    $('bossfill').style.width = clamp(enemy.hp / enemy.maxHp * 100, 0, 100) + '%';
  },

  hideBossBar() {
    if (Game.test && Game.test.headless) return;
    $('bosswrap').classList.remove('on');
  },
};
