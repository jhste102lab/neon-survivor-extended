'use strict';
// Game-over and win result overlays.
/* ================================================================
   UI results
   ================================================================ */
Object.assign(UI, {
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
    Music.stop();
    UI.hideBossBar();
    const newBest = this.saveRecord(false);
    $('nbOver').classList.toggle('hide', !newBest);
    $('overStats').innerHTML = this.statsHtml();
    LeaderboardController.submitRunAndRefresh({ won: false, targetId: 'overLeaderboard' });
    showOverlay('overOv');
  },

  win() {
    Game.state = 'win';
    Music.stop();
    UI.hideBossBar();
    AudioFX.win();
    const newBest = this.saveRecord(true);
    $('nbWin').classList.toggle('hide', !newBest);
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
