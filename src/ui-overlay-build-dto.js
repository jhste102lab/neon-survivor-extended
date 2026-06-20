'use strict';
// Pause build-list DTO assembly.
function pauseBuildSlotDto(className, attributes, icon, badge) {
  return { className, attributes, icon, badge };
}

function pauseWeaponSlotDto(player, weapon) {
  const evolved = player.evolved && player.evolved[weapon.id];
  return pauseBuildSlotDto(
    'bslot',
    [
      ['title', evolved ? EVOLUTIONS[weapon.id].name : WEAPONS[weapon.id].name],
      ['style', `border-color:${evolved ? 'rgba(255,210,61,.75)' : 'rgba(25,227,255,.3)'}`],
    ],
    evolved ? EVOLUTIONS[weapon.id].icon : WEAPONS[weapon.id].icon,
    evolved ? 'E' : weapon.lv
  );
}

function pausePassiveSlotDto(player, id) {
  return pauseBuildSlotDto(
    'bslot',
    [['title', PASSIVES[id].name]],
    PASSIVES[id].icon,
    player.passives[id]
  );
}

function pauseCompanionSlotDto(companion, rank, summary) {
  return pauseBuildSlotDto(
    'bslot companionSlot',
    [
      ['style', 'border-color:rgba(125,255,193,.55)'],
      ['title', `${companion.name} — ${summary}`],
    ],
    companion.icon,
    rank
  );
}

function pauseCompanionInfoDto(companion, rank, summary) {
  return { icon: companion.icon, name: companion.name, rank, summary };
}

function pauseTranscendLevel(player, id) {
  return { tdmg: player.transcend.dmg, tcd: player.transcend.cd, thp: player.transcend.hp, tspd: player.transcend.spd }[id];
}

function pauseTranscendSlotDto(transcend, level) {
  return pauseBuildSlotDto(
    'bslot',
    [['style', 'border-color:rgba(255,43,214,.5)']],
    transcend.icon,
    level
  );
}

const UIPauseBuildDto = {
  fromPlayer(player) {
    const slots = [];
    const companionInfo = [];
    for (const weapon of player.weapons) slots.push(pauseWeaponSlotDto(player, weapon));
    for (const id in player.passives) slots.push(pausePassiveSlotDto(player, id));
    if (player.companions && player.companions.count > 0) {
      for (const role of (player.companions.roles || [])) {
        const companion = COMPANION_ROLES[role];
        const rank = player.companions.roleRanks && player.companions.roleRanks[role] ? player.companions.roleRanks[role] : 1;
        if (companion) {
          const summary = companionEffectSummary(role);
          slots.push(pauseCompanionSlotDto(companion, rank, summary));
          companionInfo.push(pauseCompanionInfoDto(companion, rank, summary));
        }
      }
    }
    for (const transcend of TRANSCEND) {
      const level = pauseTranscendLevel(player, transcend.id);
      if (level > 0) slots.push(pauseTranscendSlotDto(transcend, level));
    }
    return { slots, companionInfo };
  },
};
