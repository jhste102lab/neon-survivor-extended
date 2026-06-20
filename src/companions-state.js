'use strict';
// Companion state shape and migration/normalization helpers.
function createCompanionState() {
  return {
    count: 0,
    roles: [],
    echoes: [],
    roleRanks: {},
    power: 0,
    rate: 0,
    fireT: 0.6,
    guardianT: 2.8,
    markerT: 1.2,
    cleanseBudget: 0,
    trail: [],
    nodes: [],
  };
}

function companionStateFor(player) {
  if (!player.companions) player.companions = createCompanionState();
  const c = player.companions;
  if (!Array.isArray(c.roles)) c.roles = [];
  if (!Array.isArray(c.echoes)) c.echoes = [];
  if (!c.roleRanks || typeof c.roleRanks !== 'object') c.roleRanks = {};
  for (const role of c.roles) if (!c.roleRanks[role]) c.roleRanks[role] = 1;
  for (const role of c.echoes) c.roleRanks[role] = Math.max(2, c.roleRanks[role] || 1);
  if (!Array.isArray(c.trail)) c.trail = [];
  if (!Array.isArray(c.nodes)) c.nodes = [];
  c.count = c.roles.length + c.echoes.length;
  if (typeof c.guardianT !== 'number') c.guardianT = 2.8;
  if (typeof c.markerT !== 'number') c.markerT = 1.2;
  if (typeof c.cleanseBudget !== 'number') c.cleanseBudget = 0;
  return c;
}
