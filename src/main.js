'use strict';
// Application bootstrap and public development hooks.
/* ================================================================
   부트스트랩
   ================================================================ */
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
  const speedControls = $('speedControls');
  if (speedControls) speedControls.addEventListener('click', event => {
    const btn = event.target && event.target.closest ? event.target.closest('.speedBtn') : null;
    if (!btn || !speedControls.contains(btn)) return;
    AudioFX.ensure(); AudioFX.uiClick();
    Game.setUserTimeScale(Number(btn.dataset.speed) || 1);
  });
  UI.syncSpeedControls = scale => {
    const slowAllowed = Game.time >= (CFG.slowSpeedUnlockTime || 480);
    const speed = Number(scale || 1) === 0.5 ? '0.5' : String(Math.round(scale || 1));
    document.querySelectorAll('.speedBtn').forEach(btn => {
      const isSlow = Number(btn.dataset.speed) < 1;
      btn.disabled = isSlow && !slowAllowed;
      btn.classList.toggle('locked', isSlow && !slowAllowed);
      btn.classList.toggle('active', btn.dataset.speed === speed);
      if (isSlow) btn.title = slowAllowed ? 'Precision speed' : 'Unlocks at 08:00';
    });
  };
  UI.syncSpeedControls(Game.userTimeScale || 1);
  $('btnMute').addEventListener('click', () => { AudioFX.ensure(); AudioFX.toggleMute(); });
  let lastPauseTap = 0;
  const togglePause = e => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (e && e.pointerType && e.isPrimary === false) return;
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
  // 첫 제스처에서 오디오 잠금 해제
  addEventListener('pointerdown', () => AudioFX.ensure(), { once: false });
  addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('pagehide', () => { if (typeof RunSnapshot !== 'undefined') RunSnapshot.save(Game, { force: true }); });

  // 메인 루프
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

// 개발/테스트용 훅
window.G = Game;
window.UIx = UI;
window.NS_BOOT = boot;
window.NS = Object.assign(window.NS || {}, { Game, UI, Input, Render, AudioFX, Music, CFG, WEAPONS, PASSIVES, EVOLUTIONS, COMPANION_ROLES, ENEMY_TYPES, BOSSES, RNG, Profile, Leaderboard, UpgradeRules, GameRuntime, RunRecords, RunSnapshot, PerformanceBudget, I18N, sim: BalanceSim });

if (!window.NS_NO_AUTO_BOOT) boot();
