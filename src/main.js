'use strict';
// Application bootstrap and public development hooks.
/* ================================================================
   부트스트랩
   ================================================================ */
function runFocusButtonAction() {
  const recallReady = Game.state === 'play'
    && !!Game.focusMode
    && typeof Game.hasScoutPickupRecall === 'function'
    && Game.hasScoutPickupRecall()
    && typeof Game.focusedPickupCount === 'function'
    && Game.focusedPickupCount() > 0
    && typeof Game.consumeFocusPickups === 'function';
  if (recallReady) {
    AudioFX.ensure(); AudioFX.uiClick();
    Game.consumeFocusPickups();
    return;
  }
  if (['play', 'pause', 'levelup'].includes(Game.state)) {
    AudioFX.ensure(); AudioFX.uiClick();
    Game.focusMode = !Game.focusMode;
  }
}

function runDashButtonAction() {
  if (Game.state !== 'play' || typeof Game.tryStartDash !== 'function') return;
  if (!Game.tryStartDash()) return;
  AudioFX.ensure(); AudioFX.uiClick();
}

function bindImmediateActionButton(button, action) {
  if (!button) return;
  let lastRun = 0;
  const run = event => {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    const now = performance.now();
    if (now - lastRun < 220) return;
    lastRun = now;
    action();
  };
  if (window.PointerEvent) {
    button.addEventListener('pointerdown', run);
    button.addEventListener('click', event => { if (event.detail === 0) run(event); });
  } else {
    button.addEventListener('touchstart', run, { passive: false });
    button.addEventListener('click', run);
  }
}

function bindSpeedControls() {
  document.querySelectorAll('.speedBtn').forEach(btn => {
    bindImmediateActionButton(btn, () => {
      if (btn.disabled) return;
      AudioFX.ensure(); AudioFX.uiClick();
      Game.setUserTimeScale(Number(btn.dataset.speed) || 1);
    });
  });
  UI.syncSpeedControls = scale => {
    const slowAllowed = Game.time >= (CFG.slowSpeedUnlockTime || 480);
    const speed = Number(scale || 1) === 0.5 ? '0.5' : String(Math.round(scale || 1));
    document.querySelectorAll('.speedBtn').forEach(btn => {
      const isSlow = Number(btn.dataset.speed) < 1;
      btn.disabled = isSlow && !slowAllowed;
      btn.classList.toggle('locked', isSlow && !slowAllowed);
      btn.classList.toggle('active', btn.dataset.speed === speed);
      const shortcut = { '0.5': '~', '1': '1', '2': '2', '3': '3' }[btn.dataset.speed] || '';
      const baseTitle = isSlow ? (slowAllowed ? 'Precision speed' : 'Unlocks at 08:00') : `${btn.dataset.speed}x speed`;
      btn.title = shortcut ? `${baseTitle} · shortcut ${shortcut}` : baseTitle;
    });
  };
  UI.syncSpeedControls(Game.userTimeScale || 1);
}

function bindPauseButton() {
  let lastPauseTap = 0;
  const togglePause = e => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const now = performance.now();
    if (now - lastPauseTap < 360) return;
    lastPauseTap = now;
    AudioFX.ensure(); AudioFX.uiClick();
    if (Game.state === 'play') Game.pause();
    else if (Game.state === 'pause') Game.resume();
  };
  const pauseBtn = $('btnPause');
  if (window.PointerEvent) {
    pauseBtn.addEventListener('pointerdown', togglePause);
    pauseBtn.addEventListener('click', e => { if (e.detail === 0) togglePause(e); });
  } else {
    pauseBtn.addEventListener('touchstart', togglePause, { passive: false });
    pauseBtn.addEventListener('click', togglePause);
  }
}

function startMainLoop() {
  let last = performance.now();
  const loop = (now) => {
    const rdt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!Game.test.manualClock) {
      const frameStart = performance.now();
      Game.update(rdt);
      Render.draw();
      UI.frame();
      if (typeof PerformanceBudget !== 'undefined') PerformanceBudget.recordFrame(performance.now() - frameStart);
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

function boot() {
  if (typeof Game.assertWeaponFireHandlers === 'function') Game.assertWeaponFireHandlers();
  Render.init();
  Input.init();
  // 기록 / 음소거 설정 로드
  try {
    Game.best = RunRecords.loadBest();
    AudioFX.applyPersistedMute();
  } catch (e) {
    console.warn('Local preference load failed; continuing with defaults.');
  }
  if (typeof I18N !== 'undefined') I18N.init();
  Profile.initDom();
  Game.reset();
  Game.state = 'title';
  UI.refreshTitleBest();
  UI.refreshBestMini();
  UI.refreshLeaderboard();
  if (UI.refreshContinueRun) UI.refreshContinueRun();

  // 버튼
  const bind = (id, fn) => $(id).addEventListener('click', () => { AudioFX.ensure(); AudioFX.uiClick(); fn(); });
  bind('btnStart', () => Game.start());
  bind('btnContinueRun', () => Game.restoreLastRun());
  bind('btnResume', () => Game.resume());
  bind('btnRestart', () => Game.start());
  bind('btnQuit', () => UI.toTitle());
  bind('btnRetry', () => Game.start());
  bind('btnRetry2', () => Game.start());
  bind('btnEndless', () => Game.goEndless());
  bind('btnToTitle', () => UI.toTitle());
  bind('btnToTitle2', () => UI.toTitle());
  bind('btnRandomNick', () => Profile.randomizeInput());
  bindImmediateActionButton($('btnFocusMode'), runFocusButtonAction);
  bindImmediateActionButton($('btnDash'), runDashButtonAction);
  bindSpeedControls();
  $('btnMute').addEventListener('click', () => { AudioFX.ensure(); AudioFX.toggleMute(); });
  bindPauseButton();
  // 첫 제스처에서 오디오 잠금 해제
  addEventListener('pointerdown', () => AudioFX.ensure(), { once: false });
  addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('pagehide', () => { if (typeof RunSnapshot !== 'undefined') RunSnapshot.save(Game, { force: true }); });

  // 메인 루프
  startMainLoop();
}

// 개발/테스트용 훅
window.G = Game;
window.UIx = UI;
window.NS_BOOT = boot;
window.NS = Object.assign(window.NS || {}, { Game, UI, Input, Render, AudioFX, Music, CFG, WEAPONS, PASSIVES, EVOLUTIONS, COMPANION_ROLES, ENEMY_TYPES, BOSSES, RNG, Profile, Leaderboard, UpgradeRules, GameRuntime, RunRecords, RunSnapshot, PerformanceBudget, I18N, sim: BalanceSim });

if (!window.NS_NO_AUTO_BOOT) boot();
