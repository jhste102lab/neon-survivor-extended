'use strict';
// Field event reward grants.
Object.assign(Game, {
  grantEventReward(ev) {
    const canGrantEvo = this.grantEvolutionToken && this.evolutionCount && this.evolutionCount() < Object.keys(EVOLUTIONS).length;
    if (canGrantEvo && RNG.next() < 0.55) {
      this.grantEvolutionToken(`event:${ev.type}`);
      return;
    }
    const comp = this.companionChoices ? this.companionChoices().filter(o => o.kind === 'nc' && COMPANION_ROLES[o.id]) : [];
    if (comp.length && RNG.next() < 0.48) {
      this.applyUpgrade(weightedPick(comp));
      return;
    }
    if (ev.type === 'supply') {
      this.spawnDrop('chest', ev.x, ev.y, CFG.dropLife.bossChest, true);
      this.spawnDrop('magnet', ev.x + 34, ev.y + 12);
    } else if (ev.type === 'contract') {
      this.levelQueue += 1;
      this.spawnDrop('chest', this.player.x + rand(-80, 80), this.player.y + rand(-80, 80), CFG.dropLife.chest);
    } else {
      this.spawnDrop('chest', this.player.x + rand(-70, 70), this.player.y + rand(-70, 70), CFG.dropLife.chest);
      if (RNG.next() < 0.55) this.spawnDrop('bomb', this.player.x + rand(-60, 60), this.player.y + rand(-60, 60));
    }
  },
});
