'use strict';
// Runtime adapter for DOM, audio, profile, and leaderboard side effects.
// Game/domain modules call this seam instead of reaching into UI or browser APIs directly.
const GameRuntime = {
  activeGame() {
    return typeof globalThis !== 'undefined' && globalThis.Game ? globalThis.Game : (typeof Game !== 'undefined' ? Game : null);
  },

  isHeadless(game = null) {
    const target = game || this.activeGame();
    return !!(target && target.test && target.test.headless);
  },

  runId() {
    return typeof Profile !== 'undefined' ? Profile.runId() : String(Date.now());
  },

  ensureProfileName() {
    if (typeof Profile !== 'undefined') Profile.ensureName();
  },

  showOverlay(id) {
    if (!this.isHeadless()) showOverlay(id);
  },

  setHudVisible(on) {
    if (this.isHeadless()) return;
    const hud = $('hud');
    if (hud) hud.classList.toggle('on', !!on);
  },

  clearBanners() {
    if (this.isHeadless()) return;
    const wrap = $('bannerwrap');
    if (wrap) wrap.innerHTML = '';
  },

  resetRunHud() {
    if (!this.isHeadless() && typeof UI !== 'undefined') UI.resetRunHud();
  },

  refreshBestMini() {
    if (!this.isHeadless() && typeof UI !== 'undefined') UI.refreshBestMini();
  },

  hideBossBar() {
    if (!this.isHeadless() && typeof UI !== 'undefined') UI.hideBossBar();
  },

  showPause() {
    if (!this.isHeadless() && typeof UI !== 'undefined') UI.showPause();
  },

  showLevelUp() {
    if (!this.isHeadless() && typeof UI !== 'undefined') UI.showLevelUp();
  },

  gameOver() {
    const game = this.activeGame();
    if (this.isHeadless()) {
      if (game) game.state = 'over';
      return;
    }
    if (typeof UI !== 'undefined') UI.gameOver();
  },

  pickLevelCard(index) {
    if (!this.isHeadless() && typeof UI !== 'undefined') UI.pickCard(index);
  },

  banner(text, tone) {
    if (!this.isHeadless() && typeof UI !== 'undefined') UI.banner(text, tone);
  },

  ensureAudio() {
    if (!this.isHeadless() && typeof AudioFX !== 'undefined') AudioFX.ensure();
  },

  toggleMute() {
    if (typeof AudioFX !== 'undefined') {
      this.ensureAudio();
      AudioFX.toggleMute();
    }
  },

  suspendAudio() {
    if (typeof AudioFX !== 'undefined') AudioFX.suspendCtx();
  },

  resumeAudio() {
    if (typeof AudioFX !== 'undefined') AudioFX.resumeCtx();
  },

  pauseForHiddenDocument(game = this.activeGame()) {
    if (game && game.state === 'play' && typeof game.pause === 'function') game.pause();
    this.suspendAudio();
  },

  resumeForVisibleDocument(game = this.activeGame()) {
    if (!game || game.state !== 'pause') this.resumeAudio();
  },

  startMusic() {
    if (this.isHeadless() || typeof Music === 'undefined') return;
    Music.stop();
    Music.start();
  },

  resumeMusic() {
    if (!this.isHeadless() && typeof Music !== 'undefined') Music.start();
  },

  setMusicIntensity(level) {
    if (typeof Music !== 'undefined') Music.setIntensity(level);
  },


  stopMusic() {
    if (typeof Music !== 'undefined') Music.stop();
  },

  playSound(name, ...args) {
    if (this.isHeadless() || typeof AudioFX === 'undefined' || typeof AudioFX[name] !== 'function') return;
    AudioFX[name](...args);
  },

  resetComboHud() {
    if (!this.isHeadless() && typeof UI !== 'undefined') UI.resetComboHud();
  },

  showCombo(n) {
    if (!this.isHeadless() && typeof UI !== 'undefined') UI.combo(n);
  },

  markKillsDirty() {
    if (!this.isHeadless() && typeof UI !== 'undefined') UI.killDirty = true;
  },

  showBossBar(name) {
    if (!this.isHeadless() && typeof UI !== 'undefined') UI.showBossBar(name);
  },

  updateBossBar(enemy) {
    if (!this.isHeadless() && typeof UI !== 'undefined') UI.updateBossBar(enemy);
  },

  flashEffect(id, duration = 0.6) {
    if (this.isHeadless()) return;
    const fx = $(id);
    if (!fx) return;
    fx.style.transition = 'none';
    fx.style.opacity = 1;
    requestAnimationFrame(() => { fx.style.transition = `opacity ${duration}s`; fx.style.opacity = 0; });
  },

  restartCssAnimation(id, className) {
    if (this.isHeadless()) return;
    const el = $(id);
    if (!el) return;
    el.classList.remove(className);
    void el.offsetWidth;
    el.classList.add(className);
  },

  scheduleLevelUpPrompt(game = this.activeGame(), delayMs = 280) {
    if (this.isHeadless(game) || !game) return;
    setTimeout(() => { if (game.state === 'play' && game.player && !game.player.dead) this.showLevelUp(); }, delayMs);
  },

  viewportHalf(extraX = 0, extraY = extraX) {
    const w = typeof innerWidth === 'number' ? innerWidth : 1280;
    const h = typeof innerHeight === 'number' ? innerHeight : 720;
    return { w: w / 2 + extraX, h: h / 2 + extraY };
  },

  isMobileViewport() {
    const w = typeof innerWidth === 'number' ? innerWidth : 1280;
    const h = typeof innerHeight === 'number' ? innerHeight : 720;
    const coarse = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
    return coarse && (w <= 760 || (w <= 920 && h <= 520));
  },

  beginLeaderboardRun(runId) {
    if (typeof Leaderboard !== 'undefined') return Leaderboard.beginRun(runId);
    return null;
  },
};

if (typeof globalThis !== 'undefined') globalThis.GameRuntime = GameRuntime;
