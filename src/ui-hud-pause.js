'use strict';
// Pause button active-state rendering.
const UIHudPause = {
  updateButton(game) {
    const pauseBtn = $('btnPause');
    if (pauseBtn) pauseBtn.classList.toggle('on', game.state === 'play');
    const speedControls = $('speedControls');
    if (speedControls) speedControls.classList.toggle('on', game.state === 'play' || game.state === 'pause' || game.state === 'levelup');
  },
};
