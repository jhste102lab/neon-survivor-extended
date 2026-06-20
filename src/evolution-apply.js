'use strict';
// Late-game evolution state changes, metrics, banners, and combat side effects.
Object.assign(Game, {
  grantEvolutionToken(reason = 'event') {
    if (!this.player || !this.evolutionUnlocked()) return false;
    this.player.evoBonusTokens = Math.min(3, (this.player.evoBonusTokens || 0) + 1);
    this.metrics.evoTokenGrants = this.metrics.evoTokenGrants || [];
    this.metrics.evoTokenGrants.push({ t: Math.round(this.time), reason });
    GameRuntime.banner(tr('banner.evoCore'), 'good');
    return true;
  },

  applyEvolution(id) {
    if (!this.evolutionReady(id)) return false;
    const w = this.player.weapons.find(w => w.id === id);
    if (!w) return false;
    this.player.evolved[id] = true;
    this.player.evoSpent = (this.player.evoSpent || 0) + 1;
    w.evolved = true;
    w.lv = Math.max(w.lv, MAX_LV);
    w.timer = Math.min(w.timer || 0, 0.15);
    this.metrics.evolutions = this.metrics.evolutions || [];
    this.metrics.evolutions.push({ t: Math.round(this.time), id });
    GameRuntime.banner(tr('banner.evolutionComplete', { icon: EVOLUTIONS[id].icon, name: EVOLUTIONS[id].name }), 'good');
    this.slotsDirty = true;
    return true;
  },

  applyEvolutionSideEffect(id, target) {
    if (id === 'lightning' && target) {
      target.vulnerableT = Math.max(target.vulnerableT || 0, target.boss ? 2.2 : 3.4);
      target.vulnerableK = Math.max(target.vulnerableK || 0, target.boss ? 0.1 : 0.16);
    }
  },
});
