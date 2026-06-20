'use strict';
// Companion role effect dispatcher.
Object.assign(Game, {
  updateCompanionRoles(dt, st, c) {
    const p = this.player;

    if (c.roles.includes('guardian')) {
      updateCompanionGuardianRoleEffect(this, p, dt, c);
    }

    if (c.roles.includes('scout')) {
      updateCompanionScoutRoleEffect(this, p, dt, c);
    }

    if (c.roles.includes('marker')) {
      updateCompanionMarkerRoleEffect(this, dt, c);
    }

    if (c.roles.includes('decoy')) {
      updateCompanionDecoyRoleEffect(this, c);
    }

    if (c.roles.includes('cleanser')) {
      updateCompanionCleanserRoleEffect(this, p, dt, c);
    }
  },
});
