'use strict';
// Game run lifecycle, pause/resume, endless mode, and keyboard state transitions.
Object.assign(Game, {
  /* ---------- lifecycle / frame orchestration ---------- */
  reset() {
    const initial = createInitialRunState();
    this.time = initial.time; this.timeScale = initial.timeScale; this.userTimeScale = initial.userTimeScale; this.hitStopT = initial.hitStopT;
    this.enemies.length = 0; this.bullets.length = 0; this.ebullets.length = 0;
    this.gems.length = 0; this.drops.length = 0; this.hazards.length = 0; this.particles.length = 0;
    this.texts.length = 0; this.novas.length = 0; this.beams.length = 0; this.bolts.length = 0; this.megaAbsorbs.length = 0; this.bossLinks.length = 0;
    this.kills = initial.kills; this.combo = initial.combo; this.comboT = initial.comboT; this.maxCombo = initial.maxCombo;
    this.boss = initial.boss; this.levelQueue = initial.levelQueue; this.deathT = initial.deathT; this.novaSeq = initial.novaSeq;
    this.dir = initial.dir;
    this.cam.x = initial.cam.x; this.cam.y = initial.cam.y; this.shakeT = 0;
    this.blades.angle = initial.blades.angle;
    this.frameSeq = initial.frameSeq; this.frameTargets = initial.frameTargets;
    if (typeof Grid !== 'undefined' && Grid.map) Grid.map.clear();
    this.endless = initial.endless; this.st = initial.st; this.activeEvent = initial.activeEvent; this.nextEventT = initial.nextEventT; this.lastBossSpawnT = initial.lastBossSpawnT;
    this.bossDebuffs = initial.bossDebuffs;
    this.idleT = initial.idleT; this.lastIdleWarnT = initial.lastIdleWarnT;
    this.unlockNotified = initial.unlockNotified;
    this.metrics = initial.metrics;
    this.runId = initial.runId;
    this.runProof = initial.runProof;
    this.player = initial.player;
    this.lastWeaponSlotCap = maxWeaponSlotsFor(this);
    this.slotsDirty = true;
    if (this.resetBossInteractionState) this.resetBossInteractionState();
    if (typeof UI !== 'undefined' && UI.syncSpeedControls) UI.syncSpeedControls(this.userTimeScale || 1);
    GameRuntime.setMusicIntensity(1);
  },

  start() {
    GameRuntime.ensureProfileName();
    if (typeof RunSnapshot !== 'undefined') RunSnapshot.clear();
    this.reset();
    if (typeof PerformanceBudget !== 'undefined') PerformanceBudget.reset();
    this.state = 'play';
    GameRuntime.showOverlay(null);
    GameRuntime.setHudVisible(true);
    GameRuntime.hideBossBar();
    GameRuntime.clearBanners();
    GameRuntime.resetRunHud();
    GameRuntime.ensureAudio();
    GameRuntime.startMusic();
    GameRuntime.refreshBestMini();
    GameRuntime.beginLeaderboardRun(this.runId);
  },

  pause() {
    if (this.state !== 'play') return;
    this.state = 'pause';
    if (typeof RunSnapshot !== 'undefined') RunSnapshot.save(this, { force: true });
    GameRuntime.showPause();
    GameRuntime.suspendAudio(); // 일시정지 중엔 소리도 정지
  },

  resume() {
    if (this.state !== 'pause') return;
    this.state = 'play';
    GameRuntime.showOverlay(null);
    GameRuntime.setHudVisible(true);
    GameRuntime.resumeAudio();
    // 일시정지 사이에 밀린 레벨업 처리
    if (this.levelQueue > 0 && !this.player.dead) GameRuntime.showLevelUp();
  },

  restoreLastRun() {
    if (typeof RunSnapshot === 'undefined' || !RunSnapshot.restore(this)) return false;
    if (typeof PerformanceBudget !== 'undefined') PerformanceBudget.reset();
    GameRuntime.setHudVisible(true);
    GameRuntime.clearBanners();
    GameRuntime.hideBossBar();
    GameRuntime.ensureAudio();
    if (this.state === 'play') GameRuntime.startMusic();
    else GameRuntime.suspendAudio();
    GameRuntime.refreshBestMini();
    GameRuntime.beginLeaderboardRun(this.runId);
    if (this.state === 'pause') GameRuntime.showPause();
    else GameRuntime.showOverlay(null);
    return true;
  },

  enterEndlessLoop(showBanner = true) {
    if (this.endless || !this.player || this.player.dead) return;
    this.endless = true;
    this.dir.bossIdx = Math.max(this.dir.bossIdx || 0, 3);
    this.dir.bossT = Math.max(this.dir.bossT || 0, 35);
    this.dir.nextEndlessBossT = Math.max(this.dir.nextEndlessBossT || 0, CFG.winTime + 60);
    this.slotsDirty = true;
    if (showBanner) GameRuntime.banner(tr('banner.endlessEnter'), 'warn');
  },

  goEndless() { // 레거시 승리창 버튼 호환: 현재 빌드에서는 승리창을 띄우지 않는다.
    if (this.state !== 'win' && this.state !== 'play') return;
    this.enterEndlessLoop(false);
    this.state = 'play';
    GameRuntime.showOverlay(null);
    GameRuntime.resumeAudio();
    GameRuntime.resumeMusic();
    GameRuntime.banner(tr('banner.endlessContinue'), 'warn');
  },

  onKey(k, event = null) {
    if (this.state === 'title' && (k === 'enter' || k === ' ')) { this.start(); return; }
    if (!event || !event.repeat) {
      if (k === 'tab' && (this.state === 'play' || this.state === 'pause' || this.state === 'levelup')) {
        this.focusMode = !this.focusMode;
        return;
      }
      if ((k === 'e' || k === 'ㄷ') && this.state === 'play' && typeof this.consumeFocusPickups === 'function') {
        this.consumeFocusPickups();
        return;
      }
      if (k === ' ' && this.state === 'play' && typeof this.tryStartDash === 'function') {
        this.tryStartDash();
        return;
      }
    }
    if (this.state === 'levelup' && ['1', '2', '3'].includes(k)) { GameRuntime.pickLevelCard(+k - 1); return; }
    const speedByKey = { '`': 0.5, '~': 0.5, '1': 1, '2': 2, '3': 3 };
    if (this.state !== 'title' && Object.prototype.hasOwnProperty.call(speedByKey, k)) {
      this.setUserTimeScale(speedByKey[k]);
      return;
    }
    if (k === 'm' || k === 'ㅡ') { GameRuntime.toggleMute(); return; }
    if (this.state === 'play' && (k === 'p' || k === 'ㅔ' || k === 'escape')) this.pause();
    else if (this.state === 'pause' && (k === 'p' || k === 'ㅔ' || k === 'escape')) this.resume();
    else if ((this.state === 'over' || this.state === 'win') && k === 'enter') this.start();
  },
});
