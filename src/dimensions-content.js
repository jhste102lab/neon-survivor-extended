'use strict';
// Dimension-mode static content: portal labels, room goals, relics, and reward cards.
const DIMENSION_GATEKEEPER = Object.freeze({
  name: '균열 문지기', shape: 'hex', color: '#41f0ff', r: 74, hp: 26000, spd: 48, dmg: 34, xp: 220,
  gatekeeper: true, dash: false, ring: true, ringN: 18, ringCd: 4.8, ringGap: 2, trap: true, trapCd: 6.4, laneTrap: true, laneCd: 7.2,
});

const DIMENSION_RELICS = Object.freeze({
  nebula_sense: { id: 'nebula_sense', icon: '🌌', name: '성운 감각', color: '#7de8ff', desc: '피격 직전 짧게 시간을 늦춥니다.', detail: '위험한 피격 직전 0.35초 슬로우 · 쿨다운 18초' },
  insulated_glove: { id: 'insulated_glove', icon: '🧤', name: '절연 장갑', color: '#ffd23d', desc: '레이저와 장판 피해를 한 번 막습니다.', detail: '위험 장판/레이저 피해 1회 80% 감소 · 쿨다운 16초' },
  gravity_fracture: { id: 'gravity_fracture', icon: '🕳️', name: '중력 파열', color: '#a36bff', desc: '주기적으로 적을 끌어모아 폭발합니다.', detail: '10초마다 주변 적을 끌고 작은 폭발 피해' },
  verdict_mark: { id: 'verdict_mark', icon: '⚖️', name: '심판의 표식', color: '#ff7ad9', desc: '보스와 엘리트에게 주는 피해가 증가합니다.', detail: '보스/엘리트 피해 +12%' },
  cleansing_spore: { id: 'cleansing_spore', icon: '🍄', name: '정화 포자', color: '#7dffc1', desc: '독성 장판을 견디고 정화하면 회복합니다.', detail: '역병/독성 피해 25% 감소 · 정화 시 소형 회복' },
  mirror_veil: { id: 'mirror_veil', icon: '🔷', name: '반사막', color: '#9ff3ff', desc: '적 탄환 하나를 막고 되돌립니다.', detail: '적 탄환 1개 무효/반사 · 쿨다운 14초' },
  propulsion_core: { id: 'propulsion_core', icon: '🚄', name: '추진 코어', color: '#ffb13d', desc: '짧은 이동 가속이 충전됩니다.', detail: '이동 중 12초마다 1.1초 가속' },
  lucky_pact: { id: 'lucky_pact', icon: '🎰', name: '행운 계약', color: '#ffd23d', desc: '보상 선택과 드롭 운이 좋아집니다.', detail: '차원 보상 선택지 품질과 드롭 품질 소폭 증가' },
});

const DIMENSIONS = Object.freeze([
  { id: 'bullet_nebula', icon: '🌌', asset: 'assets/dimensions/noto-emoji/emoji_u1f30c.svg', name: '탄막 성운', danger: 3, relic: 'nebula_sense', color: '#7de8ff', accent: '#ff7ad9',
    goal: '성운 코어 안정화', objectiveLabel: '성운 코어', kind: 'core', target: 1, summary: '탄막 사이를 읽고 성운 코어를 파괴합니다.', completeText: '성운 코어 안정화 완료' },
  { id: 'machine_prison', icon: '⚡', asset: 'assets/dimensions/noto-emoji/emoji_u26a1.svg', name: '기계 감옥', danger: 3, relic: 'insulated_glove', color: '#ffd23d', accent: '#41f0ff',
    goal: '발전기 파괴', objectiveLabel: '발전기', kind: 'generators', target: 4, summary: '레이저와 전기벽을 피해 발전기를 부숩니다.', completeText: '감옥 전원 차단' },
  { id: 'gravity_well', icon: '🕳️', asset: 'assets/dimensions/noto-emoji/emoji_u1f573.svg', name: '중력 우물', danger: 4, relic: 'gravity_fracture', color: '#a36bff', accent: '#7dffc1',
    goal: '중력 앵커 파괴', objectiveLabel: '중력 앵커', kind: 'anchors', target: 3, summary: '끌림과 밀림 속에서 적을 몰아 앵커를 파괴합니다.', completeText: '중력 우물 안정화' },
  { id: 'judges_duel', icon: '⚖️', asset: 'assets/dimensions/noto-emoji/emoji_u2696.svg', name: '심판자의 결투', danger: 4, relic: 'verdict_mark', color: '#ff7ad9', accent: '#ffffff',
    goal: '심판자 처치', objectiveLabel: '심판자', kind: 'duel', target: 1, summary: '느린 패턴 보스의 판결을 읽고 처치합니다.', completeText: '판결장 안정화' },
  { id: 'plague_garden', icon: '🍄', asset: 'assets/dimensions/noto-emoji/emoji_u1f344.svg', name: '역병 정원', danger: 4, relic: 'cleansing_spore', color: '#7dffc1', accent: '#ff5e8a',
    goal: '독성 둥지 정화', objectiveLabel: '독성 둥지', kind: 'nests', target: 5, summary: '오염 영역을 관리하며 둥지와 포자 코어를 정화합니다.', completeText: '역병 정원 정화' },
  { id: 'mirror_corridor', icon: '🔷', asset: 'assets/dimensions/noto-emoji/emoji_u1f537.svg', name: '거울 회랑', danger: 3, relic: 'mirror_veil', color: '#9ff3ff', accent: '#c39bff',
    goal: '진짜 거울핵 파괴', objectiveLabel: '거울핵', kind: 'mirrors', target: 3, summary: '진짜와 가짜 핵을 구분하고 반사탄을 피합니다.', completeText: '거울 회랑 안정화' },
  { id: 'train_battlefield', icon: '🚄', asset: 'assets/dimensions/noto-emoji/emoji_u1f684.svg', name: '열차 위 전장', danger: 4, relic: 'propulsion_core', color: '#ffb13d', accent: '#41f0ff',
    goal: '강습 웨이브 방어', objectiveLabel: '강습 웨이브', kind: 'train', target: 4, summary: '움직이는 전장에서 침입 드론과 강습선을 격퇴합니다.', completeText: '수송선 방어 완료' },
  { id: 'casino_rift', icon: '🎰', asset: 'assets/dimensions/noto-emoji/emoji_u1f3b0.svg', name: '도박장의 균열', danger: 5, relic: 'lucky_pact', color: '#ffd23d', accent: '#ff2bd6',
    goal: '계약 라운드 승리', objectiveLabel: '계약 라운드', kind: 'casino', target: 3, summary: '위험과 보상이 공개된 계약을 고르고 라운드를 승리합니다.', completeText: '잭팟 균열 안정화' },
]);

const DIMENSION_REWARD_CARDS = Object.freeze([
  { id: 'recover', type: 'survival', icon: '❤️', name: '재정비', desc: '체력을 35% 회복합니다.', color: '#7dffc1' },
  { id: 'barrier', type: 'survival', icon: '🛡️', name: '보호막 보급', desc: '최대 체력 25% 보호막을 얻습니다.', color: '#9ff3ff' },
  { id: 'weapon_power', type: 'combat', icon: '⚔️', name: '무기 과충전', desc: '모든 무기 피해가 소폭 증가합니다.', color: '#ff7ad9' },
  { id: 'boss_mark', type: 'combat', icon: '🎯', name: '강적 표식', desc: '보스/엘리트에게 주는 피해가 증가합니다.', color: '#ffd23d' },
  { id: 'drop_quality', type: 'economy', icon: '🍀', name: '보급 품질', desc: '드롭과 회복 보정이 소폭 좋아집니다.', color: '#7dffc1' },
  { id: 'risk_pact', type: 'risk', icon: '💎', name: '위험 계약', desc: '외부 위험도가 오르지만 화력이 증가합니다.', color: '#ff4d5e' },
]);

if (typeof globalThis !== 'undefined') Object.assign(globalThis, { DIMENSION_GATEKEEPER, DIMENSIONS, DIMENSION_RELICS, DIMENSION_REWARD_CARDS });
