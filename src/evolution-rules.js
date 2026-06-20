'use strict';
// Late-game evolution unlock, token capacity, readiness, and choice rules.
Object.assign(Game, {
  evolutionUnlocked() {
    return !!this.player && (this.endless || this.time >= (CFG.unlockTime || CFG.winTime));
  },

  weaponEvolved(id) {
    return !!(this.player && this.player.evolved && this.player.evolved[id]);
  },

  evolutionCount() {
    return Object.keys(this.player && this.player.evolved ? this.player.evolved : {}).length;
  },

  scheduledEvolutionTokens() {
    if (!this.evolutionUnlocked()) return 0;
    const late = Math.max(0, this.time - (CFG.unlockTime || CFG.winTime));
    if (late < 120) return 1;
    return Math.min(Object.keys(EVOLUTIONS).length, 2 + Math.floor((late - 120) / 180));
  },

  evolutionCapacity() {
    const scheduled = this.scheduledEvolutionTokens();
    const eventBoost = Math.min(3, this.player ? (this.player.evoBonusTokens || 0) : 0);
    return Math.min(Object.keys(EVOLUTIONS).length, scheduled + eventBoost);
  },

  evolutionTokens() {
    if (!this.player) return 0;
    return Math.max(0, this.evolutionCapacity() - (this.player.evoSpent || 0));
  },

  evolutionReady(id) {
    if (!this.evolutionUnlocked() || this.evolutionTokens() <= 0) return false;
    const evo = EVOLUTIONS[id];
    if (!evo || this.weaponEvolved(id)) return false;
    const w = this.player.weapons.find(w => w.id === id);
    if (!w || w.lv < MAX_LV) return false;
    return (this.player.passives[evo.passive] || 0) >= 3;
  },

  evolutionChoices() {
    if (!this.evolutionUnlocked() || this.evolutionTokens() <= 0) return [];
    const opts = [];
    for (const id in EVOLUTIONS) {
      if (this.evolutionReady(id)) opts.push({ kind: 'ev', id, w: 7.2 });
    }
    return opts;
  },
});
