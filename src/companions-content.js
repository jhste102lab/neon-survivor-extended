'use strict';
// Static companion role content and display text helpers.
const COMPANION_MAX_COUNT = 12;
const COMPANION_VISIBLE_ROLES = 6;
const COMPANION_ROLES = {
  guardian: {
    icon: '🛡️', name: '수호 네온', tag: '동료 역할', color: '#7dffc1',
    desc: '뒤따르는 네온이 주기적으로 보호막을 충전합니다.',
  },
  scout: {
    icon: '🧲', name: '정찰 네온', tag: '동료 역할', color: '#9ff3ff',
    desc: '근처 보석과 보급품을 끌어와 성장 흐름을 지켜줍니다.',
  },
  marker: {
    icon: '🎯', name: '표식 네온', tag: '동료 역할', color: '#ffe37d',
    desc: '강한 적에게 네온 표식을 새겨 집중 공격을 돕습니다.',
  },
  decoy: {
    icon: '🪩', name: '미끼 네온', tag: '동료 역할', color: '#c39bff',
    desc: '적의 진입 속도를 늦춰 탄막 사이에 숨 쉴 공간을 만듭니다.',
  },
  striker: {
    icon: '💫', name: '타격 네온', tag: '동료 역할', color: '#7dffc1',
    desc: '가까운 적을 자동 사격으로 견제하지만 전장을 덮지는 않습니다.',
  },
  cleanser: {
    icon: '✨', name: '정화 네온', tag: '동료 역할', color: '#ffffff',
    desc: '가까운 적 탄환을 제한적으로 지워 회피선을 열어줍니다.',
  },
};
const COMPANION_UPGRADES = { ...COMPANION_ROLES };
for (const role in COMPANION_ROLES) {
  COMPANION_UPGRADES[`echo_${role}`] = {
    ...COMPANION_ROLES[role],
    name: `${COMPANION_ROLES[role].name} 공명`,
    tag: '동료 증폭',
    desc: '이미 합류한 역할의 네온이 뒤쪽 대열에서 힘을 보탭니다.',
  };
}

function companionRoleId(id) {
  return id && id.startsWith('echo_') ? id.slice(5) : id;
}

function companionEffectSummary(id) {
  const role = companionRoleId(id);
  const localized = typeof I18N !== 'undefined'
    && I18N.content[I18N.current]
    && I18N.content[I18N.current].companions
    && I18N.content[I18N.current].companions.roles
    && I18N.content[I18N.current].companions.roles[role];
  return localized && localized.summary ? localized.summary : tr('companions.defaultSummary');
}

function companionBannerText(id) {
  const role = companionRoleId(id);
  const C = COMPANION_UPGRADES[id] || COMPANION_ROLES[role];
  if (!C) return tr('companions.joinFallback');
  const summary = companionEffectSummary(id);
  return id && id.startsWith('echo_')
    ? tr('companions.echoJoin', { icon: C.icon, name: C.name, summary })
    : tr('companions.join', { icon: C.icon, name: C.name, summary });
}
