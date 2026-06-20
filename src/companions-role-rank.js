'use strict';
// Companion role rank lookup shared by role effect modules.
function companionRoleRank(c, role) {
  return c.roleRanks && c.roleRanks[role] ? c.roleRanks[role] : (c.roles.includes(role) ? 1 : 0);
}

