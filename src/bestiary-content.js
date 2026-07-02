'use strict';
// 한글 적 도감 콘텐츠. 수집형이 아니라 시작 전 이해를 돕는 전체 공개형 설명이다.
const BESTIARY_TABS = [
  { id: 'normal', name: '일반 적' },
  { id: 'special', name: '특수 적' },
  { id: 'boss', name: '보스' },
  { id: 'hazard', name: '이벤트/위험' },
  { id: 'dimension', name: '차원' },
];

const BESTIARY_ENTRIES = [
  { tab: 'normal', ref: 'enemy:mite', title: '소형 감염체', role: '가장 기본적인 접근형 적', danger: '낮음', appears: '초반부터', behavior: '직선으로 접근해 접촉 피해를 줍니다.', risk: '수가 많아지면 퇴로를 막습니다.', tip: '초반 무기 성장용으로 빠르게 정리하세요.' },
  { tab: 'normal', ref: 'enemy:runner', title: '러너', role: '빠른 추격형 적', danger: '중간', appears: '초반부터', behavior: '빠른 속도로 파고듭니다.', risk: '탄막보다 먼저 몸으로 압박합니다.', tip: '대시를 아끼지 말고 측면으로 빠지세요.' },
  { tab: 'normal', ref: 'enemy:swarm', title: '무리 개체', role: '대량 압박형 적', danger: '중간', appears: '초반부터', behavior: '작고 많은 개체가 흔들리며 접근합니다.', risk: '후반에는 시야와 이동 경로를 잡아먹습니다.', tip: '광역/관통 무기 가치가 높습니다.' },
  { tab: 'normal', ref: 'enemy:tank', title: '탱커', role: '느린 고체력 적', danger: '중간', appears: '초반 이후', behavior: '느리지만 오래 버팁니다.', risk: '뒤쪽 적을 가려 화력을 분산시킵니다.', tip: '관통·체인 무기로 뒤쪽까지 같이 정리하세요.' },
  { tab: 'normal', ref: 'enemy:shooter', title: '궁수', role: '원거리 조준탄 적', danger: '높음', appears: '약 02:20 이후', behavior: '거리를 유지하며 조준탄을 발사합니다.', risk: '잡몹 사이에서 탄이 섞이면 피격 원인을 놓치기 쉽습니다.', tip: '탄을 보고 짧게 비껴 움직이세요.' },
  { tab: 'normal', ref: 'enemy:brute', title: '브루트', role: '대형 압박 적', danger: '높음', appears: '중반 이후', behavior: '느리지만 체력과 피해가 큽니다.', risk: '퇴로를 막고 보스 패턴과 겹치면 위험합니다.', tip: '강한 단일 화력과 밀쳐내기로 거리 유지가 중요합니다.' },

  { tab: 'special', ref: 'enemy:charger', title: '차저', role: '경고 후 돌진', danger: '높음', appears: '5분 이후', behavior: '잠깐 방향을 잡은 뒤 빠르게 돌진합니다.', risk: '경고를 놓치면 한 번에 거리를 좁힙니다.', tip: '경고 방향과 수직으로 빠지세요.' },
  { tab: 'special', ref: 'enemy:bulwark', title: '불워크', role: '주변 적 보호', danger: '중간', appears: '5분 이후', behavior: '근처 적의 피해를 줄여 줍니다.', risk: '무리를 오래 살려 화면 압박을 키웁니다.', tip: '보호 중심을 우선 제거하세요.' },
  { tab: 'special', ref: 'enemy:warden', title: '워든', role: '경고 장판 시전자', danger: '높음', appears: '5분 이후', behavior: '플레이어 이동 방향 앞에 위험 장판을 예고합니다.', risk: '멈춰 있거나 직선 이동만 하면 맞기 쉽습니다.', tip: '경고 원을 확인하고 이동 방향을 바꾸세요.' },
  { tab: 'special', ref: 'enemy:miner', title: '마이너', role: '지뢰 설치', danger: '중간', appears: '5분 이후', behavior: '지나간 자리에 오래 남는 지뢰를 둡니다.', risk: '회피 경로를 뒤늦게 막습니다.', tip: '지뢰가 많은 방향으로 후퇴하지 마세요.' },
  { tab: 'special', ref: 'enemy:spawner', title: '스포너', role: '적 소환', danger: '높음', appears: '5분 이후', behavior: '주변에 러너와 무리 개체를 불러냅니다.', risk: '방치하면 화면 밀도가 빠르게 올라갑니다.', tip: '보이면 우선순위를 높여 제거하세요.' },
  { tab: 'special', ref: 'enemy:bomber', title: '폭발체', role: '근접 정지 후 폭발', danger: '높음', appears: '5분 이후 약한 버전, 10분 이후 강화', behavior: '가까이 오면 멈추고 경고 후 폭발합니다.', risk: '보스 패턴 중 안전지대를 좁힐 수 있습니다.', tip: '멈추는 순간 폭발 반경 밖으로 빠지세요.' },

  { tab: 'boss', ref: 'boss:0', title: '수호자 헥사', role: '첫 보스', danger: '높음', appears: '03:00', behavior: '대시와 소환으로 기본 보스전을 가르칩니다.', risk: '잡몹과 함께 접근하면 퇴로가 좁아집니다.', tip: '대시 타이밍을 보고 반대 방향으로 빠지세요.' },
  { tab: 'boss', ref: 'boss:1', title: '포식자 옥타', role: '탄막 보스', danger: '높음', appears: '06:00', behavior: '원형 탄막과 소환을 함께 사용합니다.', risk: '탄막 사이 빈틈을 못 보면 연속 피격됩니다.', tip: '탄막은 한 번에 크게 움직이지 말고 틈을 따라 움직이세요.' },
  { tab: 'boss', ref: 'boss:2', title: '심연의 별', role: '강화 패턴 보스', danger: '매우 높음', appears: '09:00', behavior: '강한 소환과 탄막, 레이저 패턴을 사용합니다.', risk: '보스 패턴과 후반 압박이 겹칠 수 있습니다.', tip: '큰 패턴 경고 때는 잡몹보다 안전 경로를 먼저 보세요.' },
  { tab: 'boss', ref: 'boss:gatekeeper', title: '균열 문지기', role: '10분 차원 관문 보스', danger: '높음', appears: '10:00', behavior: '탄막, 예고 레이저, 장판으로 차원 허브 진입을 시험합니다.', risk: '잡몹 물량보다 패턴 회피를 요구합니다.', tip: '레이저 예고선과 원형 탄막의 빈틈을 먼저 보세요.' },
  { tab: 'boss', ref: 'boss:3', title: '군집 코어', role: '후반 루프 메가 보스', danger: '매우 높음', appears: '10:00 이후 반복', behavior: '탄막, 장판, 레이저, 포식장을 함께 사용합니다.', risk: '자석을 흡수하면 XP 부채가 생깁니다.', tip: '포식 경고가 나오면 자석/폭탄을 우선 차단하거나 회수하세요.' },

  { tab: 'hazard', icon: '🛰️', title: '정체 감지', role: '제자리 방지', danger: '중간', appears: '08:00 이후', behavior: '진짜 방치 상태가 길어지면 이동을 유도하는 위험이 생깁니다.', risk: '이벤트/보스 패턴과 겹치면 억울해질 수 있어 이번부터 전술 정지는 유예됩니다.', tip: '이동하거나 전투/이벤트에 참여하면 압박이 줄어듭니다.' },
  { tab: 'hazard', icon: '⚪', title: '위험 장판', role: '경고 후 범위 피해', danger: '높음', appears: '중반 이후', behavior: '원형 경고가 표시된 뒤 피해가 들어옵니다.', risk: '여러 장판이 겹치면 퇴로가 줄어듭니다.', tip: '경고 원의 가장 가까운 바깥쪽으로 빠르게 이동하세요.' },
  { tab: 'hazard', icon: '🔷', title: '도탄 레이저', role: '이벤트/보스 회피 패턴', danger: '높음', appears: '10분 이후 본격 등장', behavior: '경고선 이후 긴 레이저가 지나갑니다.', risk: '반사 경로를 못 보면 안전 공간을 착각할 수 있습니다.', tip: '경고선이 없는 빈 공간을 먼저 찾으세요.' },
  { tab: 'hazard', icon: '🕳️', title: '보스 포식장', role: '픽업 흡수', danger: '높음', appears: '후반 보스', behavior: '보스가 보석과 아이템을 끌어당깁니다.', risk: '자석을 흡수당하면 경험치 부채가 생깁니다.', tip: '몸으로 차단하거나 포식 전에 아이템을 회수하세요.' },
  { tab: 'hazard', icon: '🌩️', title: '네온 폭풍', role: '탄막 이벤트', danger: '높음', appears: '5분 이후 이벤트', behavior: '주변에서 탄막과 레이저가 들어옵니다.', risk: '멈춰야 하는 안전 공간과 제자리 방지가 충돌하지 않도록 조정됩니다.', tip: '탄막의 빈틈을 따라 짧게 이동하세요.' },
  { tab: 'hazard', icon: '📦', title: '보급품 위험 구역', role: '보상 점유 이벤트', danger: '중간', appears: '5분 이후 이벤트', behavior: '보급 구역을 유지하면 보상을 얻지만 위험 장판이 생깁니다.', risk: '무리하게 중앙을 고집하면 장판에 갇힙니다.', tip: '구역 가장자리에서 장판을 빼며 버티세요.' },
  { tab: 'hazard', icon: '🌀', title: '리프트/이벤트 구역', role: '점유형 이벤트', danger: '중간', appears: '5분 이후 이벤트', behavior: '구역 안에 머물수록 진행도가 오릅니다.', risk: '구역 유지 중 움직임이 적어도 전술 정지로 판정됩니다.', tip: '완전히 멈추기보다 작은 원을 그리며 유지하세요.' },


  { tab: 'dimension', ref: 'dimension:bullet_nebula', icon: '🌌', title: '탄막 성운', role: '탄막 회피 + 코어 파괴', danger: '높음', appears: '차원 허브', behavior: '성운 코어와 노드가 원형/나선 탄막을 발사합니다.', risk: '탄막 가독성을 놓치면 연속 피격됩니다.', tip: '코어 우선 타겟팅을 믿고 빈틈을 따라 움직이세요.' },
  { tab: 'dimension', ref: 'dimension:machine_prison', icon: '⚡', title: '기계 감옥', role: '레이저 회피 + 발전기 파괴', danger: '높음', appears: '차원 허브', behavior: '레이저, 전기벽, 문 패턴 사이에서 발전기를 파괴합니다.', risk: '예고선을 늦게 보면 안전칸을 잃습니다.', tip: '발전기 파괴 후 나오는 보급을 활용하세요.' },
  { tab: 'dimension', ref: 'dimension:gravity_well', icon: '🕳️', title: '중력 우물', role: '중력 조작 + 웨이브 처치', danger: '매우 높음', appears: '차원 허브', behavior: '끌림과 밀림이 반복되고 앵커 주변에 탄막이 생깁니다.', risk: '중력에 과하게 저항하면 이동 경로가 꼬입니다.', tip: '적이 뭉치는 순간 광역 화력으로 녹이세요.' },
  { tab: 'dimension', ref: 'dimension:judges_duel', icon: '⚖️', title: '심판자의 결투', role: '느린 패턴 보스전', danger: '매우 높음', appears: '차원 허브', behavior: '십자 레이저, 부채꼴 탄막, 안전지대 장판을 사용합니다.', risk: '빠른 추격은 아니지만 판단 실수가 큰 피해로 이어집니다.', tip: '움직여야 하는 패턴과 멈춰야 하는 패턴을 구분하세요.' },
  { tab: 'dimension', ref: 'dimension:plague_garden', icon: '🍄', title: '역병 정원', role: '오염 영역 관리', danger: '매우 높음', appears: '차원 허브', behavior: '독성 포자와 둥지가 오염 구역을 퍼뜨립니다.', risk: '한 방향으로만 도망치면 오염에 갇힙니다.', tip: '둥지를 하나씩 정리하며 회복 드롭을 확보하세요.' },
  { tab: 'dimension', ref: 'dimension:mirror_corridor', icon: '🔷', title: '거울 회랑', role: '진짜/가짜 판단', danger: '높음', appears: '차원 허브', behavior: '진짜 거울핵과 가짜 핵, 반사탄, 프리즘 레이저가 등장합니다.', risk: '가짜 핵을 건드리면 반격 탄막이 늘어납니다.', tip: '시각 단서를 보고 진짜 핵을 우선 파괴하세요.' },
  { tab: 'dimension', ref: 'dimension:train_battlefield', icon: '🚄', title: '열차 위 전장', role: '이동 전장 + 웨이브 방어', danger: '매우 높음', appears: '차원 허브', behavior: '움직이는 전장에서 드론 습격과 강습선을 막습니다.', risk: '장애물과 적 처치가 겹치면 시야가 흔들립니다.', tip: '화면 중앙을 유지하고 폭탄 드롭을 아끼지 마세요.' },
  { tab: 'dimension', ref: 'dimension:casino_rift', icon: '🎰', title: '도박장의 균열', role: '계약 선택 전투', danger: '매우 높음', appears: '차원 허브', behavior: '공개된 위험/보상 계약을 고르고 3라운드를 승리합니다.', risk: '고위험 계약을 연속으로 고르면 탄막이 급격히 늘어납니다.', tip: '현재 체력과 빌드에 맞는 계약을 고르세요.' },

  { tab: 'hazard', icon: '▧', title: 'XP 부채', role: '성장 지연 상태', danger: '중간', appears: '보스가 자석 흡수 시', behavior: 'XP를 얻으면 먼저 부채를 갚고, 남은 XP가 바를 채웁니다.', risk: '보이지 않으면 XP가 멈춘 것처럼 느껴집니다.', tip: '회색 XP바가 줄어들면 부채가 상환 중이라는 뜻입니다.' },
];
