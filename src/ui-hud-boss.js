'use strict';
// Boss health bar rendering.
const UIHudBoss = {
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
