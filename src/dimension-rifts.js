'use strict';
// Field-event rift variants: small, early, choice-driven field encounters. Automatic dimension rifts live in dimensions.js.
const DIMENSION_RIFTS = Object.freeze({
  archive: Object.freeze({ id: 'archive', icon: '📚', name: '기록 보관소 균열장', color: '#41f0ff', enemyTypes: ['runner', 'shooter'], spawnEvery: 2.15, holdGoal: 7.2 }),
  casino: Object.freeze({ id: 'casino', icon: '🎰', name: '도박장 균열장', color: '#ffd23d', enemyTypes: ['runner', 'swarm'], spawnEvery: 2.0, holdGoal: 7.6 }),
  slime: Object.freeze({ id: 'slime', icon: '🧪', name: '점액 균열장', color: '#7dffc1', enemyTypes: ['tank', 'swarm'], spawnEvery: 2.35, holdGoal: 7.4, slime: true }),
  prism: Object.freeze({ id: 'prism', icon: '🔷', name: '프리즘 균열장', color: '#a36bff', enemyTypes: ['shooter', 'runner'], spawnEvery: 2.6, holdGoal: 7.8, lasers: true }),
});

const DimensionRiftRules = {
  ids() { return Object.keys(DIMENSION_RIFTS); },
  pick() { return DIMENSION_RIFTS[pick(this.ids())] || DIMENSION_RIFTS.archive; },
  get(id) { return DIMENSION_RIFTS[id] || DIMENSION_RIFTS.archive; },
  displayName(id) {
    const def = this.get(id);
    return `${def.icon} ${def.name}`;
  },
};

globalThis.DIMENSION_RIFTS = DIMENSION_RIFTS;
globalThis.DimensionRiftRules = DimensionRiftRules;
