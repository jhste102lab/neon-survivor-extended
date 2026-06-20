'use strict';
// Presentation DTOs for upgrade cards and chest reward banners.
function weaponUpgradeDescription(choice, player) {
  const W = WEAPONS[choice.id], cur = player.weapons.find(w => w.id === choice.id);
  if (!W || !cur) return null;
  const over = cur.lv >= MAX_LV;
  return {
    icon: W.icon,
    name: W.name,
    level: over ? tr('upgrade.overLevel', { level: cur.lv - MAX_LV + 1 }) : `Lv ${cur.lv} → ${cur.lv + 1}`,
    description: over ? OVER_DESC[choice.id] : W.lvDesc[cur.lv],
    color: over ? '#ff2bd6' : '#19e3ff',
    tag: over ? tr('upgrade.weaponOver') : tr('upgrade.weaponUpgrade'),
    isNew: false,
  };
}

function newWeaponDescription(choice) {
  const W = WEAPONS[choice.id];
  if (!W) return null;
  return { icon: W.icon, name: W.name, level: tr('upgrade.lvGain'), description: W.desc, color: '#ffd23d', tag: tr('upgrade.weaponAcquire'), isNew: true };
}

function passiveUpgradeDescription(choice, player) {
  const P = PASSIVES[choice.id], cur = player.passives[choice.id];
  if (!P) return null;
  return { icon: P.icon, name: P.name, level: `Lv ${cur} → ${cur + 1}`, description: P.per, color: '#3dff8e', tag: tr('upgrade.passiveUpgrade'), isNew: false };
}

function newPassiveDescription(choice) {
  const P = PASSIVES[choice.id];
  if (!P) return null;
  return { icon: P.icon, name: P.name, level: tr('upgrade.lvGain'), description: P.desc, color: '#3dff8e', tag: tr('upgrade.passiveAcquire'), isNew: true };
}

function evolutionDescription(choice) {
  const E = typeof EVOLUTIONS !== 'undefined' ? EVOLUTIONS[choice.id] : null;
  if (!E) return null;
  return { icon: E.icon, name: E.name, level: weaponEvolutionRecipeText(choice.id), description: E.desc, color: E.color, tag: E.tag, isNew: false };
}

function companionDescription(choice, player) {
  const upgrades = typeof COMPANION_UPGRADES !== 'undefined' ? COMPANION_UPGRADES : {};
  const C = upgrades[choice.id], st = player.companions || { count: 0 };
  if (!C) return null;
  const echo = choice.id && choice.id.startsWith('echo_');
  return {
    icon: C.icon,
    name: C.name,
    level: echo ? tr('upgrade.echoLevel', { from: st.count, to: st.count + 1 }) : tr('upgrade.companionLevel', { from: st.count, to: st.count + 1 }),
    description: C.desc,
    color: C.color || '#7dffc1',
    tag: C.tag,
    isNew: false,
  };
}

function transcendDescription(choice) {
  const T = TRANSCEND.find(t => t.id === choice.id);
  if (!T) return null;
  return { icon: T.icon, name: T.name, level: tr('upgrade.infinite'), description: T.desc, color: '#ff2bd6', tag: tr('upgrade.transcend'), isNew: false };
}

const UpgradeDescriptionByKind = {
  w: weaponUpgradeDescription,
  ow: weaponUpgradeDescription,
  nw: newWeaponDescription,
  p: passiveUpgradeDescription,
  np: newPassiveDescription,
  ev: evolutionDescription,
  nc: companionDescription,
  t: transcendDescription,
};

const ChestRewardTextByKind = {
  w: choice => tr('chest.weapon', { icon: WEAPONS[choice.id].icon, name: WEAPONS[choice.id].name }),
  ow: choice => tr('chest.weapon', { icon: WEAPONS[choice.id].icon, name: WEAPONS[choice.id].name }),
  nw: choice => tr('chest.newWeapon', { icon: WEAPONS[choice.id].icon, name: WEAPONS[choice.id].name }),
  ev: choice => tr('chest.evolution', { icon: EVOLUTIONS[choice.id].icon, name: EVOLUTIONS[choice.id].name }),
  p: choice => tr('chest.passive', { icon: PASSIVES[choice.id].icon, name: PASSIVES[choice.id].name }),
  np: choice => tr('chest.passive', { icon: PASSIVES[choice.id].icon, name: PASSIVES[choice.id].name }),
  nc: choice => `📦 ${typeof companionBannerText === 'function' ? companionBannerText(choice.id) : `${COMPANION_UPGRADES[choice.id].icon} ${COMPANION_UPGRADES[choice.id].name}!`}`,
  t: choice => tr('chest.transcend', { icon: TRANSCEND.find(t => t.id === choice.id).icon }),
  heal: () => tr('chest.heal'),
};

const UpgradeDescriptions = {
  validateContracts() {
    UpgradeKindContract.validateTables(UpgradeDescriptionByKind, ChestRewardTextByKind);
  },

  describeChoice(choice, game = Game) {
    if (!choice || choice.kind === 'heal') return this.healDescription();
    if (!game || !game.player) return this.healDescription();
    UpgradeKindContract.require(choice.kind);
    const describe = UpgradeDescriptionByKind[choice.kind];
    const dto = describe && describe(choice, game.player);
    if (!dto) throw new Error(`Upgrade description unavailable for ${choice.kind}:${choice.id || ''}`);
    return dto;
  },

  healDescription() {
    return { icon: '🍗', name: tr('upgrade.rations'), level: '', description: tr('upgrade.rationsDesc'), color: '#ff4d8e', tag: tr('upgrade.healTag') };
  },

  chestRewardText(choice) {
    if (!choice) return tr('chest.heal');
    UpgradeKindContract.require(choice.kind);
    const textForKind = ChestRewardTextByKind[choice.kind];
    if (!textForKind) throw new Error(`Chest reward text unavailable for upgrade kind: ${choice.kind}`);
    return textForKind(choice);
  },
};

UpgradeDescriptions.validateContracts();
