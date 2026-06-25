'use strict';
// Game-wide configuration and balance constants.
/* ---------------- 설정/밸런스 ---------------- */
const CFG = {
  ruleset: 'phase2-2026-06-20-evolution24',
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
  focusMode: { pullRadius: 360, pullSpeed: 560, holdRadiusGem: 66, holdRadiusDrop: 78 },
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
};
