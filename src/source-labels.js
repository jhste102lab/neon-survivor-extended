'use strict';
// Human-readable labels for combat sources in results and leaderboard details.
const SourceLabels = {
  enemyNames: {
    mite: '소형 감염체', runner: '러너', swarm: '무리 개체', tank: '탱커', shooter: '궁수', brute: '브루트',
  },
  dropNames: { bomb: '폭탄', chicken: '치킨', magnet: '자석', chest: '상자' },
  kindNames: {
    contact: '접촉 피해', 'enemy projectile': '적 투사체', 'boss projectile': '보스 투사체', 'boss hazard': '보스 장판', hazard: '장판', pressure: '압박 패턴', other: '기타',
  },

  combatSource(source) {
    const raw = String(source || '').trim();
    if (!raw) return '없음';
    if (raw.startsWith('weapon:')) return this.weaponSource(raw);
    if (raw.startsWith('drop:')) return this.dropSource(raw);
    if (raw.startsWith('enemy:')) return this.enemySource(raw);
    if (raw.startsWith('special:')) return this.specialSource(raw);
    if (raw.startsWith('boss:')) return this.bossSource(raw);
    if (raw.startsWith('director:')) return '방치 압박 패턴';
    if (raw === 'unknown') return '알 수 없음';
    return raw.replace(/[:_-]+/g, ' ');
  },

  weaponSource(raw) {
    const parts = raw.split(':');
    const id = parts[1] || '';
    const evolved = parts.includes('evolved');
    const table = evolved && typeof EVOLUTIONS !== 'undefined' && EVOLUTIONS[id] ? EVOLUTIONS : WEAPONS;
    const base = table && table[id] && table[id].name ? table[id].name : id;
    if (parts.includes('split')) return `${base} 분열탄`;
    if (parts.includes('field')) return `${base} 지속장`;
    return evolved ? `${base} 진화` : base;
  },

  dropSource(raw) {
    const parts = raw.split(':');
    const name = this.dropNames[parts[1]] || parts[1] || '아이템';
    if (parts.includes('boss-absorb')) return `${name} 역류`;
    return name;
  },

  enemySource(raw) {
    const parts = raw.split(':');
    const name = this.enemyNames[parts[1]] || parts[1] || '몬스터';
    if (parts.includes('contact')) return `${name} 접촉`;
    if (parts.includes('bullet') || parts.includes('shot')) return `${name} 투사체`;
    return name;
  },

  specialSource(raw) {
    const parts = raw.split(':');
    const name = parts[1] || '특수몹';
    if (parts.includes('contact')) return `${name} 접촉`;
    return `특수몹 ${name}`;
  },

  bossSource(raw) {
    if (raw.includes('anti-kite')) return '보스 거리 견제';
    if (raw.includes('mega-ring')) return '합체 보스 링 장판';
    if (raw.includes('mega-lane')) return '합체 보스 차단 장판';
    if (raw.includes('ring')) return '보스 링 장판';
    if (raw.includes('lane')) return '보스 차단 장판';
    if (raw.includes('contact')) return '보스 접촉';
    if (raw.includes('mega')) return '합체 보스 공격';
    return '보스 공격';
  },

  damageKind(kind) {
    return this.kindNames[String(kind || '')] || this.combatSource(kind);
  },
};

if (typeof globalThis !== 'undefined') globalThis.SourceLabels = SourceLabels;
