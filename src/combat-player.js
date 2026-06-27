'use strict';
// Player damage resolution: barrier absorption, hurt feedback, and death transition.
const CombatPlayer = (() => {
  function sourceIgnoresInvulnerability(source) {
    const s = String(source || '');
    return s.startsWith('director:idle') || s.startsWith('boss:mega');
  }

  function playerCanBeHurt(game, player, source) {
    if (game && game.fieldTestInvincible) return false;
    return !player.dead && (!(player.invuln > 0) || sourceIgnoresInvulnerability(source));
  }

  function barrierPierceRatio(source) {
    const s = String(source || '');
    if (s.startsWith('director:idle')) return 0.72;
    if (s.startsWith('boss:mega')) return 0.42;
    return 0;
  }

  function consumeBarrier(player, damage, source) {
    const blockable = damage * (1 - barrierPierceRatio(source));
    const block = Math.min(player.barrier, blockable);
    player.barrier -= block;
    return damage - block;
  }

  function applyBarrierAbsorption(game, player, damage, source) {
    if (!(player.barrier > 0)) return damage;
    const remainingDamage = consumeBarrier(player, damage, source);
    CombatUiFx.showBarrierBlock(game, player);
    return remainingDamage;
  }

  function grantBarrierInvulnerability(player) {
    player.invuln = CFG.player.invuln * 0.45;
  }

  function subtractPlayerHealth(player, damage) {
    player.hp -= damage;
  }

  function recordLastDamageSource(game, source) {
    game.metrics.lastDamageSource = source;
  }

  function classifyDamageSource(source) {
    const s = String(source || 'unknown');
    if (s.startsWith('boss:mega') || s.startsWith('boss:')) return s.includes('ring') || s.includes('lane') || s.includes('trap') ? 'boss hazard' : 'boss projectile';
    if (s.startsWith('enemy:') || s.includes('bullet')) return 'enemy projectile';
    if (s.includes('contact')) return 'contact';
    if (s.startsWith('hazard')) return 'hazard';
    if (s.startsWith('director:')) return 'pressure';
    return 'other';
  }

  function recordDamageEvent(game, damage, source) {
    if (!game.metrics) return;
    const event = { t: Math.round((game.time || 0) * 10) / 10, source: String(source || 'unknown').slice(0, 48), kind: classifyDamageSource(source), damage: Math.round(damage * 10) / 10 };
    game.metrics.recentDamage = Array.isArray(game.metrics.recentDamage) ? game.metrics.recentDamage : [];
    game.metrics.recentDamage.push(event);
    game.metrics.recentDamage = game.metrics.recentDamage.filter(item => (game.time || 0) - item.t <= 5).slice(-10);
    game.metrics.damageTakenBySource = game.metrics.damageTakenBySource || {};
    game.metrics.damageTakenBySource[event.source] = (game.metrics.damageTakenBySource[event.source] || 0) + event.damage;
  }

  function startPlayerInvulnerability(player) {
    player.invuln = CFG.player.invuln;
  }

  function applyPlayerHealthDamage(game, player, damage, source) {
    subtractPlayerHealth(player, damage);
    recordLastDamageSource(game, source);
    recordDamageEvent(game, damage, source);
    startPlayerInvulnerability(player);
  }

  function playerIsDead(player) {
    return player.hp <= 0;
  }

  function recordDeathSource(game, source) {
    game.metrics.deathSource = source;
    game.metrics.deathRecentDamage = Array.isArray(game.metrics.recentDamage) ? game.metrics.recentDamage.slice(-10) : [];
  }

  function markPlayerDead(game, player) {
    player.hp = 0;
    player.dead = true;
    game.deathT = 1.4;
  }

  function startDeathTransition(game, player, source) {
    recordDeathSource(game, source);
    markPlayerDead(game, player);
    CombatUiFx.playPlayerDeathFeedback(game, player);
  }

  function finishPlayerDamage(game, player, source) {
    if (playerIsDead(player)) startDeathTransition(game, player, source);
  }

  return {
    hurtPlayer(dmg, source = 'unknown') {
      const p = this.player;
      if (!playerCanBeHurt(this, p, source)) return;

      dmg = applyBarrierAbsorption(this, p, dmg, source);
      if (dmg <= 0) {
        grantBarrierInvulnerability(p);
        return;
      }

      applyPlayerHealthDamage(this, p, dmg, source);
      this.breakCombo();
      CombatUiFx.playPlayerHurtFeedback(this);
      finishPlayerDamage(this, p, source);
    },
  };
})();
