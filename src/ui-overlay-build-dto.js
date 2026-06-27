'use strict';
// Pause build-list DTO assembly.
function pauseBuildSlotDto(className, attributes, icon, badge, detail = null) {
  return { className, attributes, icon, badge, detail };
}

function pauseWeaponSlotDto(player, weapon) {
  const evolved = player.evolved && player.evolved[weapon.id];
  const base = evolved ? EVOLUTIONS[weapon.id] : WEAPONS[weapon.id];
  const details = UpgradeDescriptions.weaponCurrentStatDetails(weapon.id, weapon.lv);
  const effectHidden = !!(Game.weaponEffectHidden && Game.weaponEffectHidden(weapon.id));
  return pauseBuildSlotDto(
    `bslot detailSlot effectToggle${effectHidden ? ' effectOff' : ''}`,
    [
      ['title', base.name],
      ['style', `border-color:${evolved ? 'rgba(255,210,61,.75)' : 'rgba(25,227,255,.3)'}`],
      ['data-detail-kind', 'weapon'],
      ['data-detail-id', weapon.id],
    ],
    base.icon,
    evolved ? 'E' : weapon.lv,
    { kind: 'weapon', id: weapon.id, effectHidden, icon: base.icon, name: base.name, level: evolved ? '진화 완료' : `Lv.${weapon.lv}`, desc: base.desc, details }
  );
}

function pausePassiveSlotDto(player, id) {
  const lv = player.passives[id] || 0;
  return pauseBuildSlotDto(
    'bslot detailSlot',
    [['title', PASSIVES[id].name], ['data-detail-kind', 'passive'], ['data-detail-id', id]],
    PASSIVES[id].icon,
    lv,
    { kind: 'passive', id, icon: PASSIVES[id].icon, name: PASSIVES[id].name, level: `Lv.${lv}`, desc: PASSIVES[id].desc, details: UpgradeDescriptions.passiveCurrentStatDetails(id, lv) }
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
