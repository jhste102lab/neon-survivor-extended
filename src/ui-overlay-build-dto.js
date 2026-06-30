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

function pauseTranscendDetails(player, transcend) {
  const level = pauseTranscendLevel(player, transcend.id);
  if (transcend.id === 'tdmg') return [`누적 레벨: ${level}`, `모든 무기 피해: +${level * 8}%p`];
  if (transcend.id === 'tcd') return [`누적 레벨: ${level}`, `공격 간격 배율: ${Math.pow(0.96, level).toFixed(2)}x`, '최소 공격 간격: 0.30초'];
  if (transcend.id === 'thp') return [`누적 레벨: ${level}`, `최대 체력: +${level * 20}`, '선택할 때마다 즉시 20 회복'];
  if (transcend.id === 'tspd') return [`누적 레벨: ${level}`, `이동속도: +${level * 5}%`, '이동속도 상한: 2.3배'];
  return [`누적 레벨: ${level}`];
}

function pauseTranscendSlotDto(player, transcend, level) {
  return pauseBuildSlotDto(
    'bslot detailSlot',
    [['style', 'border-color:rgba(255,43,214,.5)'], ['data-detail-kind', 'transcend'], ['data-detail-id', transcend.id]],
    transcend.icon,
    level,
    { kind: 'transcend', id: transcend.id, icon: transcend.icon, name: transcend.name, level: `Lv.${level}`, desc: transcend.desc, details: pauseTranscendDetails(player, transcend) }
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
      if (level > 0) slots.push(pauseTranscendSlotDto(player, transcend, level));
    }
    return { slots, companionInfo };
  },
};
