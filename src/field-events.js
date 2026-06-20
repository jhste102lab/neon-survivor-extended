'use strict';
// Field event presentation data keyed by event type.
const FIELD_EVENTS = {
  rift: {
    icon: '🌀', name: '과부하 균열', color: '#19e3ff',
    offer: '균열 안에서 버티면 진화 에너지를 얻습니다.',
  },
  storm: {
    icon: '🌩️', name: '네온 폭풍', color: '#ffd23d',
    offer: '짧은 탄막 파도를 견디면 보급품이 떨어집니다.',
  },
  contract: {
    icon: '🔺', name: '저주 계약', color: '#ff4d8e',
    offer: '강한 적의 압박을 받아들이고 버티면 큰 보상을 받습니다.',
  },
  supply: {
    icon: '📡', name: '보급 신호', color: '#7dffc1',
    offer: '위험 구역의 보급 좌표를 확보하면 상자가 열립니다.',
  },
};
