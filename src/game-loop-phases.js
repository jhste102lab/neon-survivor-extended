'use strict';
// Explicit game-loop phase schedule for deterministic verification and testing.
const GameLoopPhases = (() => {
  const PLAY_PHASES = Object.freeze([
    'run-clock-and-frame-stats',
    'player-runtime-or-death',
    'world-systems',
    'post-update-feedback-and-endless',
  ]);

  const REQUIRED_HELPERS = Object.freeze([
    'cacheFrameStats', 'refreshWeaponSlotCap', 'updatePlayerMovement', 'updateIdlePressure',
    'updatePlayerInvulnerability', 'updatePlayerRegen', 'updatePlayerTrail', 'updateCompanionRuntime',
    'fireReadyWeaponCooldowns', 'updatePersistentWeaponEffects', 'updateDeathTransition', 'updateWorldSystems',
    'updateComboTimer', 'updateCameraFollow', 'updateMusicIntensity', 'showUnlockNotificationIfReady', 'enterEndlessIfReady', 'saveRunSnapshotIfDue',
  ]);

  function assertPlayHelpers(game) {
    const missing = REQUIRED_HELPERS.filter(name => typeof game[name] !== 'function');
    if (missing.length) throw new Error(`Game loop helper scripts missing: ${missing.join(', ')}. Check game-loop-* script order.`);
  }

  function runPlayerOrDeathPhase(game, dt, rdt, st, player) {
    if (!player.dead) {
      const mv = game.updatePlayerMovement(dt, st);
      game.updateIdlePressure(dt, mv);
      game.updatePlayerInvulnerability(dt);
      game.updatePlayerRegen(dt, st);
      game.updatePlayerTrail(dt, mv);
      game.updateCompanionRuntime(dt, st);
      game.fireReadyWeaponCooldowns(dt, st);
      game.updatePersistentWeaponEffects(dt, st);
      return;
    }
    game.updateDeathTransition(rdt);
  }

  function runPostUpdatePhase(game, dt, player) {
    game.updateComboTimer(dt);
    game.updateCameraFollow(dt, player);
    game.updateMusicIntensity();
    game.showUnlockNotificationIfReady(player);
    if (game.updateLateFairnessRewards) game.updateLateFairnessRewards(dt);
    game.enterEndlessIfReady(player);
    game.saveRunSnapshotIfDue();
  }

  function runPlayFrame(game, dt, rdt) {
    assertPlayHelpers(game);
    if (game.isDimensionSpaceActive && game.isDimensionSpaceActive()) return game.runDimensionFrame(dt, rdt);
    game.time += dt;
    const player = game.player;
    const st = game.cacheFrameStats();
    game.refreshWeaponSlotCap(player);
    runPlayerOrDeathPhase(game, dt, rdt, st, player);
    game.updateWorldSystems(dt, st);
    runPostUpdatePhase(game, dt, player);
  }

  return { PLAY_PHASES, REQUIRED_HELPERS, assertPlayHelpers, runPlayFrame };
})();
