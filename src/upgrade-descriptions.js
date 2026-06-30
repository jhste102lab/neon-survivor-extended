'use strict';
// Presentation DTOs for upgrade cards and chest reward banners.

function fmtStatValue(key, value) {
  if (value === true) return 'ON';
  if (value === false) return 'OFF';
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  if (key === 'cd' || key === 'hitCd' || key === 'duration' || key === 'life' || key === 'delay' || key === 'tick') return `${n.toFixed(2)}초`;
  if (key === 'slow') return `${Math.round(n * 100)}%`;
  if (key === 'crit') return `${Math.round(n * 100)}%`;
  if (key === 'dmg' || key === 'dps' || key === 'radius' || key === 'blast' || key === 'range' || key === 'chainRange' || key === 'speed' || key === 'dist' || key === 'width' || key === 'pull' || key === 'r') return `${Math.round(n)}`;
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function statLabel(key) {
  return ({
    dmg: '피해량', dps: '초당 피해', cd: '공격 간격', count: '투사체/개수', pierce: '관통', chain: '연쇄', strikes: '낙뢰 수', pulses: '파동 수',
    radius: '범위', blast: '폭발 범위', range: '사거리', chainRange: '연쇄 범위', speed: '속도', slow: '둔화 강도', rot: '회전 속도',
    hitCd: '타격 간격', kb: '밀쳐내기', width: '두께', dual: '양방향', duration: '지속시간', life: '지속시간', delay: '발동 지연', tick: '피해 주기',
    mines: '지뢰 수', pull: '끌어당김', r: '크기', spread: '탄퍼짐', crit: '치명타 확률',
  })[key] || key;
}

function importantStatKeys(a = {}, b = {}) {
  const priority = ['dmg', 'dps', 'cd', 'count', 'pierce', 'chain', 'strikes', 'pulses', 'radius', 'blast', 'range', 'speed', 'slow', 'duration', 'life', 'delay', 'tick', 'kb', 'width', 'dual', 'pull', 'r', 'spread', 'crit'];
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return priority.filter(k => keys.has(k)).concat([...keys].filter(k => !priority.includes(k))).slice(0, 6);
}

function currentStatDetails(stats = {}, prefix = '현재') {
  return importantStatKeys(stats, {}).map(key => `${prefix} ${statLabel(key)}: ${fmtStatValue(key, stats[key])}`).slice(0, 6);
}

function weaponCurrentStatDetails(id, lv, prefix = '현재') {
  if (!WEAPONS[id] || typeof weaponStats !== 'function') return [];
  return currentStatDetails(weaponStats(id, Math.max(1, lv)), prefix);
}

function weaponStatDetails(id, fromLv, toLv) {
  if (!WEAPONS[id] || typeof weaponStats !== 'function') return [];
  const from = weaponStats(id, Math.max(1, fromLv));
  const to = weaponStats(id, Math.max(1, toLv));
  return importantStatKeys(from, to).map(key => {
    const a = from[key], b = to[key];
    if (a === b) return null;
    const up = key === 'cd' || key === 'hitCd' ? Number(b) < Number(a) : Number(b) > Number(a);
    const suffix = statDeltaSuffix(key, a, b);
    return `${statLabel(key)}: ${fmtStatValue(key, a)} → ${fmtStatValue(key, b)}${suffix ? ` (${suffix})` : ''}${up ? ' ▲' : ''}`;
  }).filter(Boolean).slice(0, 5);
}

function statDeltaSuffix(key, fromValue, toValue) {
  if (typeof fromValue === 'boolean' || typeof toValue === 'boolean') return toValue ? '해금' : '비활성';
  const from = Number(fromValue), to = Number(toValue);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return '';
  const delta = to - from;
  if (delta === 0) return '';
  if (['count', 'pierce', 'chain', 'strikes', 'pulses', 'mines'].includes(key)) return `${delta > 0 ? '+' : ''}${Math.round(delta)}`;
  if (from !== 0) {
    const pct = (delta / Math.abs(from)) * 100;
    return `${pct > 0 ? '+' : ''}${Math.round(pct)}%`;
  }
  return `${delta > 0 ? '+' : ''}${Number.isInteger(delta) ? delta : delta.toFixed(2)}`;
}

function passiveCurrentStatDetails(id, lv, prefix = '현재') {
  const rows = {
    power: [`${prefix} 모든 무기 피해: +${lv * 12}%`],
    haste: [`${prefix} 공격 간격 배율: ${Math.pow(0.93, lv).toFixed(2)}x`],
    boots: [`${prefix} 이동속도: +${lv * 8}%`],
    vitality: [`${prefix} 최대 HP: +${lv * 20}`],
    magnet: [`${prefix} 획득 범위: +${lv * 40}%`],
    regen: [`${prefix} 초당 재생: ${(lv * 0.65).toFixed(2)}`],
    luck: [`${prefix} 치명타 확률: +${lv * 3}%`, `${prefix} 드랍/행운 배율: ${(1 + lv * 0.3).toFixed(1)}x`],
    wisdom: [`${prefix} 경험치 획득: +${lv * 10}%`],
  };
  return rows[id] || [];
}

function passiveStatDetails(id, fromLv, toLv) {
  const rows = {
    power: [`모든 무기 피해: +${fromLv * 12}% → +${toLv * 12}% (+12%p)`],
    haste: [`공격 간격 배율: ${Math.pow(0.93, fromLv).toFixed(2)}x → ${Math.pow(0.93, toLv).toFixed(2)}x (-7%)`],
    boots: [`이동속도: +${fromLv * 8}% → +${toLv * 8}% (+8%p)`],
    vitality: [`최대 HP: +${fromLv * 20} → +${toLv * 20} (+20)`, '즉시 20 회복'],
    magnet: [`획득 범위: +${fromLv * 40}% → +${toLv * 40}% (+40%p)`],
    regen: [`초당 재생: ${(fromLv * 0.65).toFixed(2)} → ${(toLv * 0.65).toFixed(2)} (+0.65)`],
    luck: [`치명타 확률: +${fromLv * 3}% → +${toLv * 3}% (+3%p)`, `드랍/행운 배율: ${(1 + fromLv * 0.3).toFixed(1)}x → ${(1 + toLv * 0.3).toFixed(1)}x (+30%)`],
    wisdom: [`경험치 획득: +${fromLv * 10}% → +${toLv * 10}% (+10%p)`],
  };
  return rows[id] || [];
}

function upgradeDetailText(dto) {
  return dto && dto.details && dto.details.length ? dto.details.join('\n') : '';
}

function weaponUpgradeDescription(choice, player) {
  const W = WEAPONS[choice.id], cur = player.weapons.find(w => w.id === choice.id);
  if (!W || !cur) return null;
  const over = cur.lv >= MAX_LV;
  return {
    icon: W.icon,
    name: W.name,
    level: over ? tr('upgrade.overLevel', { level: cur.lv - MAX_LV + 1 }) : `Lv ${cur.lv} → ${cur.lv + 1}`,
    description: over ? OVER_DESC[choice.id] : W.lvDesc[cur.lv],
    details: weaponStatDetails(choice.id, cur.lv, cur.lv + 1),
    color: over ? '#ff2bd6' : '#19e3ff',
    tag: over ? tr('upgrade.weaponOver') : tr('upgrade.weaponUpgrade'),
    isNew: false,
  };
}

function newWeaponDescription(choice, player) {
  const W = WEAPONS[choice.id];
  if (!W) return null;
  return { icon: W.icon, name: W.name, level: tr('upgrade.lvGain'), description: W.desc, details: weaponCurrentStatDetails(choice.id, 1, '기본'), color: '#ffd23d', tag: tr('upgrade.weaponAcquire'), isNew: true };
}

function passiveUpgradeDescription(choice, player) {
  const P = PASSIVES[choice.id], cur = player.passives[choice.id];
  if (!P) return null;
  return { icon: P.icon, name: P.name, level: `Lv ${cur} → ${cur + 1}`, description: P.per, details: passiveStatDetails(choice.id, cur || 0, (cur || 0) + 1), color: '#3dff8e', tag: tr('upgrade.passiveUpgrade'), isNew: false };
}

function newPassiveDescription(choice) {
  const P = PASSIVES[choice.id];
  if (!P) return null;
  return { icon: P.icon, name: P.name, level: tr('upgrade.lvGain'), description: P.desc, details: passiveStatDetails(choice.id, 0, 1), color: '#3dff8e', tag: tr('upgrade.passiveAcquire'), isNew: true };
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

function transcendChoiceDetails(id, player) {
  const t = player.transcend || { dmg: 0, cd: 0, hp: 0, spd: 0 };
  if (id === 'tdmg') return [`이번 선택: 모든 무기 피해 +8%p`, `현재 누적: +${Math.round((t.dmg || 0) * 8)}%p → +${Math.round(((t.dmg || 0) + 1) * 8)}%p`];
  if (id === 'tcd') return [`이번 선택: 공격 간격 ×0.96`, `현재 배율: ${Math.pow(0.96, t.cd || 0).toFixed(2)}x → ${Math.pow(0.96, (t.cd || 0) + 1).toFixed(2)}x`, `최소 공격 간격: 0.30초`];
  if (id === 'thp') return [`이번 선택: 최대 체력 +20`, `즉시 20 회복`, `현재 누적: +${(t.hp || 0) * 20} → +${((t.hp || 0) + 1) * 20}`];
  if (id === 'tspd') return [`이번 선택: 이동속도 +5%`, `현재 배율: ${(1 + (t.spd || 0) * 0.05).toFixed(2)}x → ${(1 + ((t.spd || 0) + 1) * 0.05).toFixed(2)}x`, `이동속도 상한: 2.3배`];
  return [];
}

function transcendDescription(choice) {
  const T = TRANSCEND.find(t => t.id === choice.id);
  if (!T) return null;
  return { icon: T.icon, name: T.name, level: tr('upgrade.infinite'), description: T.desc, details: transcendChoiceDetails(choice.id, Game.player), color: '#ff2bd6', tag: tr('upgrade.transcend'), isNew: false };
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
  weaponCurrentStatDetails,
  weaponStatDetails,
  passiveCurrentStatDetails,
  passiveStatDetails,
  transcendChoiceDetails,
  upgradeDetailText,
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
