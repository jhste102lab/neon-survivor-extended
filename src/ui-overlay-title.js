'use strict';
// Title overlay transition.
const UITitleOverlay = {
  toTitle() {
    Game.state = 'title';
    Game.reset();
    if (typeof RunSnapshot !== 'undefined') RunSnapshot.clear();
    Music.stop();
    $('hud').classList.remove('on');
    UI.hideBossBar();
    UI.refreshTitleBest();
    if (UI.refreshContinueRun) UI.refreshContinueRun();
    UI.refreshLeaderboard();
    showOverlay('titleOv');
  },
};

Object.assign(UI, {
  refreshContinueRun() {
    const btn = $('btnContinueRun');
    if (!btn) return;
    const available = typeof RunSnapshot !== 'undefined' && RunSnapshot.available();
    btn.classList.toggle('hide', !available);
  },
});
