'use strict';
// Title overlay transition.
const UITitleOverlay = {
  toTitle() {
    Game.state = 'title';
    Game.reset();
    Music.stop();
    $('hud').classList.remove('on');
    UI.hideBossBar();
    UI.refreshTitleBest();
    UI.refreshLeaderboard();
    showOverlay('titleOv');
  },
};
