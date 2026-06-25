'use strict';
// Field-event presentation data. Zone colors are semantic: green = player benefit/claim, red = damage/risk, amber/purple = risk-reward pressure.
const FIELD_EVENT_COLORS = Object.freeze({
  benefit: '#3dff8e',
  danger: '#ff4d5e',
  reward: '#ffd23d',
  pressure: '#a36bff',
});

const FIELD_EVENTS = {
  rift: {
    icon: '🌀', name: '과부하 균열', color: FIELD_EVENT_COLORS.benefit, role: 'benefit',
    offer: '안에서 버티면 진화 에너지를 얻습니다.',
    hint: '안에서 버티면 진화 에너지 보상', activeHint: '초록 장판 유지 → 진화 에너지',
  },
  storm: {
    icon: '🌩️', name: '네온 폭풍', color: FIELD_EVENT_COLORS.reward, role: 'risk',
    offer: '탄막 파도를 견디면 보급품이 떨어집니다.',
    hint: '탄막을 버티면 보급품 보상', activeHint: '탄막 회피 → 보급품 드롭',
  },
  contract: {
    icon: '🔺', name: '저주 계약', color: FIELD_EVENT_COLORS.danger, role: 'danger',
    offer: '강한 압박을 버티면 큰 보상을 받습니다.',
    hint: '위험 계약: 버티면 큰 보상', activeHint: '빨간 압박 주의 → 큰 보상',
  },
  supply: {
    icon: '📡', name: '보급 신호', color: FIELD_EVENT_COLORS.benefit, role: 'benefit',
    offer: '안에서 버티면 보급 상자가 열립니다.',
    hint: '안에서 버티면 보급 상자', activeHint: '초록 장판 유지 → 보급 상자',
  },
};
