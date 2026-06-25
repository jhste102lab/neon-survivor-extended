'use strict';
// Passive upgrade definitions.
/* ----- 패시브 정의 ----- */
const PASSIVES = {
  power:   { name: '파워 코어',  icon: '💪', color: '#ff6b6b', desc: '모든 무기의 위력이 강해집니다.',         per: '모든 무기의 위력이 강해집니다.' },
  haste:   { name: '오버클럭',  icon: '⏱️', color: '#19e3ff', desc: '무기를 더 빠르게 사용할 수 있습니다.',    per: '무기를 더 빠르게 사용합니다.' },
  boots:   { name: '네온 부츠', icon: '👟', color: '#3dff8e', desc: '이동이 더욱 민첩해집니다.',              per: '이동이 더욱 민첩해집니다.' },
  vitality:{ name: '강화 심장', icon: '❤️', color: '#ff4d8e', desc: '최대 체력이 늘고 즉시 회복합니다.',       per: '최대 체력이 늘고 즉시 회복합니다.' },
  magnet:  { name: '자석 장갑', icon: '🧲', color: '#ffd23d', desc: '멀리 있는 보석도 더 쉽게 끌어옵니다.',    per: '보석을 더 쉽게 끌어옵니다.' },
  regen:   { name: '나노 재생', icon: '💚', color: '#7dff6b', desc: '체력이 조금씩 회복됩니다.',              per: '체력이 조금씩 회복됩니다.' },
  luck:    { name: '행운의 부적', icon: '🍀', color: '#5dff9a', desc: '좋은 일이 더 자주 일어납니다.',         per: '아이템과 치명타 기회가 늘어납니다.' },
  wisdom:  { name: '지식의 룬', icon: '📚', color: '#6ba8ff', desc: '성장 속도가 빨라집니다.',                per: '성장 속도가 빨라집니다.' },
  pulse:   { name: '네온 펄스', icon: '🟢', color: '#3dff8e', desc: '주변 적을 밀어내는 광역 파동을 전개합니다.', per: '광역 파동의 범위와 위력이 증가합니다.' },
  aegis:   { name: '위상 방벽', icon: '🛡️', color: '#7dffc1', desc: '전투 중 보호막을 재충전합니다.',             per: '보호막 충전량과 저장량이 증가합니다.' },
  prism:   { name: '프리즘 표식', icon: '🔷', color: '#8fd6ff', desc: '근처 적을 약화시켜 집중 공격하기 쉽게 만듭니다.', per: '약화 범위와 표식 수가 증가합니다.' },
  anchor:  { name: '중력 앵커', icon: '🟣', color: '#a36bff', desc: '적 무리 한복판에 느려지는 네온 장을 생성합니다.', per: '네온 장의 지속시간과 제어력이 증가합니다.' },
  relay:   { name: '릴레이 코일', icon: '🔗', color: '#ffd23d', desc: '주변 적 사이를 튀는 보조 전격을 호출합니다.', per: '전격의 연쇄 횟수와 피해량이 증가합니다.' },
};
