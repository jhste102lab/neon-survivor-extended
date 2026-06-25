'use strict';
// Game-over and win result overlays.
/* ================================================================
   UI results
   ================================================================ */
Object.assign(UI, {
  setNewBestName(targetId, visible) {
    const badge = $(targetId);
    if (!badge || !badge.parentNode) return;
    let nameEl = badge.parentNode.querySelector('.newbestName');
    if (!nameEl) {
      nameEl = document.createElement('div');
      nameEl.className = 'newbestName hide';
      badge.insertAdjacentElement('afterend', nameEl);
    }
    nameEl.textContent = Profile.ensureName();
    nameEl.classList.toggle('hide', !visible);
  },

  statsHtml() {
    const G = Game;
    return `
      <span class="k">${tr('stats.time')}</span><span class="v">${fmtTime(G.time)}</span>
      <span class="k">${tr('stats.level')}</span><span class="v">Lv. ${G.player.level}</span>
      <span class="k">${tr('stats.kills')}</span><span class="v">${G.kills}</span>
      <span class="k">${tr('stats.combo')}</span><span class="v">x${G.maxCombo}</span>`;
  },

  saveRecord(won) {
    return RunRecords.saveFromGame(Game, won);
  },

  gameOver() {
    Game.state = 'over';
    if (typeof RunSnapshot !== 'undefined') RunSnapshot.clear();
    Music.stop();
    UI.hideBossBar();
    const newBest = this.saveRecord(false);
    $('nbOver').classList.toggle('hide', !newBest);
    this.setNewBestName('nbOver', newBest);
    $('overStats').innerHTML = this.statsHtml();
    LeaderboardController.submitRunAndRefresh({ won: false, targetId: 'overLeaderboard' });
    showOverlay('overOv');
  },

  win() {
    Game.state = 'win';
    if (typeof RunSnapshot !== 'undefined') RunSnapshot.clear();
    Music.stop();
    UI.hideBossBar();
    AudioFX.win();
    const newBest = this.saveRecord(true);
    $('nbWin').classList.toggle('hide', !newBest);
    this.setNewBestName('nbWin', newBest);
    $('winStats').innerHTML = this.statsHtml();
    LeaderboardController.submitRunAndRefresh({ won: true, targetId: 'winLeaderboard' });
    showOverlay('winOv');
    // 축하 폭죽
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        const c = pick(['#19e3ff', '#ff2bd6', '#ffd23d', '#3dff8e']);
        Game.spawnBurst(Game.player.x + rand(-300, 300), Game.player.y + rand(-250, 250), c, 24, 280, 8, 1);
      }, i * 280);
    }
  },
});

Object.defineProperty(UI, '__splitUiReady', { value: true, configurable: true });
