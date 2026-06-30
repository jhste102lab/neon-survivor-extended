'use strict';
// Game-wide configuration and balance constants.
/* ---------------- 설정/밸런스 ---------------- */
const CFG = {
  ruleset: 'phase4-2026-06-30-late-fairness-patterns',
  winTime: 600,            // 후반 루프/리더보드 기준 시간; 승리 팝업은 사용하지 않음
  unlockTime: 300,         // 5분부터 진화/동료/추가 슬롯/이벤트 해금
  checkpointInterval: 300, // HUD의 다음 목적지 표시 간격
  weaponSlotInterval: 300, // 5분마다 무기 슬롯 확장
  weaponSlotStep: 5,
  dropTaperStart: 360,     // 6분부터 일반 보상 드롭률을 다시 낮추기 시작
  idlePressureStart: 480,  // 8분부터 제자리 방치 카운터 시작
  slowSpeedUnlockTime: 480, // 8분부터 0.5x 정밀 조작 해금
  clarityStart: 300,       // 5분부터 후반 가독성 보정 시작
  clarityFull: 480,        // 8분부터 가독성 보정을 강하게 적용
  dropMergeRadius: 48,
  maxDropStack: 3,
  magnetMotionLimit: 80,
  player: { hp: 120, speed: 235, radius: 13, pickup: 115, invuln: 0.72 },
  dash: { maxCharges: 2, growthStart: 480, growthEvery: 120, recharge: 4.8, duration: 0.14, speed: 760, invuln: 0.2, trailEvery: 0.02 },
  focusMode: { pullRadius: 360, pullSpeed: 560, holdRadiusGem: 66, holdRadiusDrop: 78, dropKindCap: 3 },
  maxEnemies: 320,
  maxGems: 380,
  maxPlayerBullets: 450,
  maxEnemyBullets: 220,
  maxHazards: 28,
  maxDrops: 120,
  lateDropCap: 78,
  lateEnemyCap: 230,
  preEndlessEnemyCap: 300,
  endlessEnemyCap: 300,
  lateGemCap: 160,
  latePlayerBulletCap: 240,
  lateParticleCap: 130,
  lateTextCap: 30,
  lateRampStart: 420,     // 7분부터 지수형 후반 압박 시작
  lateRampBase: 1.18,
  mobile: {
    visualScale: 1.08, camYOffset: -82, bottomPad: 168, dprCap: 1,
    enemyCap: 120, lateEnemyCap: 90, gemCap: 100, lateGemCap: 70,
    bulletCap: 140, lateBulletCap: 100, enemyBulletCap: 40, particleCap: 80, lateParticleCap: 40, textCap: 14, dropCap: 32,
  },
  dropLife: { chicken: 53, magnet: 53, bomb: 53, chest: 74, bossChest: 105 },
  itemDropRate: { chicken: 0.045, magnet: 0.024, bomb: 0.020, specialChest: 0.030 },
  xpNeed: lv => Math.round(6 + lv * 3.4 + Math.pow(lv, 1.5) + Math.pow(Math.max(0, lv - 40), 2) * 0.9),
  critChance: 0.1, critMult: 1.6,
  controlEffectScale: 0.34, // player/companion push-pull control tuning
  endlessDevour: {
    enabled: true, telegraph: 3, duration: 5.8, contestedRadiusDrop: 620, contestedRadiusGem: 520,
    chickenHealMaxHp: 0.018, gemHealPerXpMaxHp: 0.00008, normalHealCapMaxHp: 0.05, megaHealCapMaxHp: 0.08,
    normalHealPerMinuteCapMaxHp: 0.15, megaHealPerMinuteCapMaxHp: 0.24, lowHpHealScale: 0.5, lowHpThreshold: 0.15,
    bombBackfireHealRatio: 0.10, bombBackfireCycleCapMaxHp: 0.08,
    magnetXpProgressLoss: 0.15, magnetXpDebtCapRatio: 0.5, magnetPenaltyCooldown: 30, magnetWeaponSealT: 25,
    protectedT: 2.6, blockKnockSpeed: 360,
  },
  weaponSeals: {
    enabled: true, minActiveWeapons: 4, megaCount: 6, normalBaseCount: 3, normalMidCount: 4, normalLateCount: 5,
    normalMidTime: 780, normalLateTime: 1140, normalDuration: 70, megaDuration: 90,
    gradualStart: 45, gradualEvery: 15, topWeaponProtectedCount: 3, topWeaponSealLimit: 1,
  },
  lateXp: {
    enabled: true, start: 600, directRatio: 1, autoSettleAge: 0.25, autoSettleRatio: 1,
    scale10: 0.85, scale13: 0.75, scale16: 0.65,
  },
  lateBalance: {
    dropRampStart: 600, dropRampEnd: 960,
    chickenDropHighHpScale: 0.30, chickenDropLowHpScale: 1.15,
    chickenBaseScale10: 0.70, chickenBaseScale16: 0.48,
    magnetBaseScale10: 0.72, magnetBaseScale16: 0.55,
    bombBaseScale10: 0.62, bombBaseScale16: 0.42, bombKillDropScale: 0.25,
    chickenHealMaxHp: 0.10, chickenHealMissingHp: 0.12, chickenRepeatWindow: 8, chickenRepeatScale2: 0.70, chickenRepeatScale3: 0.50,
    bombDamage: 180, bombBossDamageScale: 0.35,
  },
  xpDebt: {
    magnetLossRatio: 0.15, capRatio: 1.0, perDevourCastCapRatio: 0.45,
  },
  lateMagnetGravity: {
    enabled: true, start: 600, duration: 5, radius: 125,
    normalSlow: 0.30, specialSlow: 0.20, bossSlow: 0.08,
  },
  lateSurvivalBonus: {
    enabled: true, start: 600, interval: 20, baseRatio: 0.05, maxRatio: 0.10,
    minKills: 10, strongKills: 36, minBossDamage: 260, strongBossDamage: 1400, eventHoldSeconds: 2.0,
  },
  dangerDirector: {
    enabled: true, bossPatternIdleGrace: 1.0, eventIdleGrace: 2.5, majorDangerGrace: 1.4,
    tacticalIdleDecay: 1.6, spawnSuppressionMul: 0.45, swarmSuppressionMul: 0.45,
  },
  bossPatternPhase: {
    enabled: true, start: 300, hardStart: 600, warn: 1.0, duration: 5.0, vulnerability: 1.0,
    shoveRadius: 430, shoveForce: 150, laserCd: 12.5, megaLaserCd: 8.8, laserDamage: 22, megaLaserDamage: 34,
    laserWidth: 28, ricochetCd: 15, ricochetDamage: 30,
  },
  specialPatterns: {
    bomberStart: 300, bomberHardStart: 600, bomberWarn: 1.05, bomberRadius: 82, bomberDamage: 24,
  },
  bossAntiKite: {
    enabled: true, distance: 580, hold: 2.8, cooldown: 12, telegraph: 2.35, pullDuration: 1.55, pullSpeed: 176,
    megaSafeExtra: 174, normalSafeExtra: 142,
    hazardRadius: 58, hazardDamage: 15, hazardLife: 2.05, hazardTick: 0.62,
  },
};
