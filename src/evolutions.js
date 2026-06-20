'use strict';
// Late-game weapon evolution content and recipe text.
const EVOLUTIONS = {
  bolt: {
    passive: 'power', icon: '💎', name: '크리스탈 볼트', color: '#62f6ff',
    tag: '무기 진화',
    desc: '매직 볼트가 적을 꿰뚫고 갈라져 뒤쪽의 적까지 압박합니다.',
  },
  orbit: {
    passive: 'boots', icon: '🛡️', name: '칼날 방벽', color: '#7dffc1',
    tag: '무기 진화',
    desc: '회전 수리검이 이중 궤도로 변하고 접근전을 버틸 보호막을 남깁니다.',
  },
  lightning: {
    passive: 'luck', icon: '🌩️', name: '심판 번개', color: '#ffe37d',
    tag: '무기 진화',
    desc: '천둥 번개가 강한 적에게 네온 표식을 남겨 집중 공격을 유도합니다.',
  },
  nova: {
    passive: 'vitality', icon: '☀️', name: '태양 파동', color: '#ff9f4d',
    tag: '무기 진화',
    desc: '화염 파동이 연속 폭발하며 위험한 순간을 막아낼 방벽을 충전합니다.',
  },
  missile: {
    passive: 'haste', icon: '🎇', name: '분열 미사일', color: '#ff7ae8',
    tag: '무기 진화',
    desc: '유도 미사일이 폭발 뒤 작은 추적탄으로 갈라져 밀집한 적을 정리합니다.',
  },
  laser: {
    passive: 'wisdom', icon: '🔷', name: '아크 레이저', color: '#c39bff',
    tag: '무기 진화',
    desc: '프리즘 레이저가 굵고 오래 남는 절단선으로 보스와 엘리트를 가릅니다.',
  },
  boomerang: {
    passive: 'regen', icon: '🪃', name: '생환 부메랑', color: '#ffdf7d',
    tag: '무기 진화',
    desc: '네온 부메랑이 돌아올 때 회복 에너지를 실어 생존 리듬을 만들어줍니다.',
  },
  frost: {
    passive: 'magnet', icon: '🧊', name: '중력 냉기장', color: '#aeeaff',
    tag: '무기 진화',
    desc: '냉기 오라가 보석과 보급품까지 끌어당기는 차가운 중력장으로 진화합니다.',
  },
  lance: {
    passive: 'power', icon: '🧬', name: '퀀텀 랜스', color: '#41f0ff',
    tag: '무기 진화',
    desc: '플라즈마 랜스가 보조 창으로 갈라져 후열까지 길게 관통합니다.',
  },
  orbital: {
    passive: 'magnet', icon: '🛰️', name: '중력 포격망', color: '#ff8a3d',
    tag: '무기 진화',
    desc: '궤도 폭격이 적 밀집 지역을 끌어당기는 중력 잔류장을 남깁니다.',
  },
  shotgun: {
    passive: 'boots', icon: '🔫', name: '브리칭 샷건', color: '#ffb13d',
    tag: '무기 진화',
    desc: '네온 산탄총이 이동 중 더 촘촘하고 강한 돌파 사격으로 변합니다.',
  },
  drone: {
    passive: 'haste', icon: '🤖', name: '하이브 드론', color: '#7dffc1',
    tag: '무기 진화',
    desc: '드론 캐논이 추가 드론과 2연발 점사로 강적을 빠르게 재조준합니다.',
  },
  blackhole: {
    passive: 'magnet', icon: '🕳️', name: '특이점 우물', color: '#b68cff',
    tag: '무기 진화',
    desc: '블랙홀 탄이 중심부 피해를 높이고 종료 시 압축 폭발을 일으킵니다.',
  },
  chainsaw: {
    passive: 'regen', icon: '⚙️', name: '부식 톱날', color: '#d9f4ff',
    tag: '무기 진화',
    desc: '체인 톱날이 연속 적중한 적에게 방어 약화 표식을 누적합니다.',
  },
  arrowrain: {
    passive: 'luck', icon: '🌠', name: '별비 사격', color: '#7dffc1',
    tag: '무기 진화',
    desc: '네온 화살비가 행운에 따라 2차 낙하와 추가 타격을 부릅니다.',
  },
  shockmine: {
    passive: 'boots', icon: '💣', name: '스프린트 지뢰망', color: '#41f0ff',
    tag: '무기 진화',
    desc: '감전 지뢰가 이동 경로 뒤를 넓게 막고 짧은 감전 둔화장을 남깁니다.',
  },
  ricochet: {
    passive: 'luck', icon: '💿', name: '잭팟 디스크', color: '#9ff3ff',
    tag: '무기 진화',
    desc: '반사 디스크가 튕길수록 강해지고 한 번 작은 디스크로 갈라집니다.',
  },
  timerift: {
    passive: 'wisdom', icon: '⏳', name: '크로노 감옥', color: '#b68cff',
    tag: '무기 진화',
    desc: '시간 균열이 오래 머문 적에게 받는 피해 증가 표식을 남깁니다.',
  },
  railgun: {
    passive: 'power', icon: '🧲', name: '오버로드 레일건', color: '#ffffff',
    tag: '무기 진화',
    desc: '레일건이 강한 적을 우선 관통하며 엘리트와 보스에게 추가 충격을 줍니다.',
  },
  toxic: {
    passive: 'regen', icon: '☣️', name: '생체 부식 안개', color: '#8dff3d',
    tag: '무기 진화',
    desc: '독성 안개가 안에 머문 적을 부식시켜 더 큰 피해를 받게 만듭니다.',
  },
  phoenix: {
    passive: 'vitality', icon: '🐦‍🔥', name: '과열 불사조', color: '#ff7a2b',
    tag: '무기 진화',
    desc: '불사조 깃털이 체력이 낮을수록 더 강하고 깊게 적진을 파고듭니다.',
  },
  sonic: {
    passive: 'vitality', icon: '📢', name: '공명 파쇄음', color: '#9ff3ff',
    tag: '무기 진화',
    desc: '음파 폭탄이 추가 공명파로 근접한 적 무리를 더 강하게 파쇄합니다.',
  },
  icespear: {
    passive: 'wisdom', icon: '🧊', name: '절대영도 창', color: '#aeeaff',
    tag: '무기 진화',
    desc: '빙결 창이 더 강한 둔화와 파편 충격으로 적 무리의 진격을 끊습니다.',
  },
  satlaser: {
    passive: 'haste', icon: '🔭', name: '가속 위성망', color: '#c39bff',
    tag: '무기 진화',
    desc: '위성 레이저가 짧고 빠른 조사로 더 많은 강적을 연속 조준합니다.',
  },
};

function weaponEvolutionRecipeText(id) {
  const evo = EVOLUTIONS[id];
  if (!evo) return '';
  const w = WEAPONS[id], p = PASSIVES[evo.passive];
  return tr('evolution.recipe', { weapon: w.name, passive: p.name });
}
