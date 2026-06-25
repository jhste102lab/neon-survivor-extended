'use strict';
// Canvas sprite and glow prerendering cache.
/* ================================================================
   스프라이트 사전 렌더링 (글로우는 비싸므로 미리 구워둠)
   ================================================================ */
const Sprites = {
  cache: {},
  cacheRadius(r) {
    return Math.max(0.5, Math.round((Number(r) || 0.5) * 2) / 2);
  },
  // 부드러운 발광 원 (파티클/총알/보석용)
  glowDot(color, r, core = '#ffffff') {
    r = this.cacheRadius(r);
    const key = `dot_${color}_${r}_${core}`;
    if (this.cache[key]) return this.cache[key];
    const size = Math.ceil(r * 5), cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const x = cv.getContext('2d'), c = size / 2;
    const g = x.createRadialGradient(c, c, 0, c, c, c);
    g.addColorStop(0, core); g.addColorStop(0.25, color);
    g.addColorStop(0.6, color.replace(')', ',0.35)').replace('rgb', 'rgba'));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, size, size);
    this.cache[key] = cv; return cv;
  },
  // 적 도형 스프라이트 (글로우 포함). white=피격 플래시용
  shape(kind, color, r, white = false) {
    r = this.cacheRadius(r);
    const key = `sh_${kind}_${color}_${r}_${white}`;
    if (this.cache[key]) return this.cache[key];
    const pad = Math.ceil(r * 0.82), size = (r + pad) * 2;
    const cv = document.createElement('canvas'); cv.width = cv.height = size;
    const x = cv.getContext('2d'), c = size / 2;
    const stroke = white ? '#ffffff' : color;
    const fill = white ? 'rgba(255,255,255,0.95)' : this._darken(color, 0.28);
    x.shadowColor = stroke; x.shadowBlur = r * 0.72;
    x.lineWidth = Math.max(2, r * 0.18);
    x.strokeStyle = stroke; x.fillStyle = fill;
    x.beginPath();
    const poly = n => {
      for (let i = 0; i <= n; i++) {
        const a = -Math.PI / 2 + i / n * TAU;
        const px = c + Math.cos(a) * r, py = c + Math.sin(a) * r;
        i ? x.lineTo(px, py) : x.moveTo(px, py);
      }
    };
    if (kind === 'circle') x.arc(c, c, r, 0, TAU);
    else if (kind === 'tri') poly(3);
    else if (kind === 'diamond') poly(4);
    else if (kind === 'penta') poly(5);
    else if (kind === 'hex') poly(6);
    else if (kind === 'oct') poly(8);
    else if (kind === 'star') {
      for (let i = 0; i <= 10; i++) {
        const a = -Math.PI / 2 + i / 10 * TAU, rr = i % 2 ? r * 0.5 : r;
        const px = c + Math.cos(a) * rr, py = c + Math.sin(a) * rr;
        i ? x.lineTo(px, py) : x.moveTo(px, py);
      }
    }
    x.closePath(); x.fill(); x.stroke();
    // 내부 코어 점
    if (!white) {
      x.shadowBlur = 0;
      x.fillStyle = 'rgba(255,255,255,0.75)';
      x.beginPath(); x.arc(c, c, r * 0.22, 0, TAU); x.fill();
    }
    this.cache[key] = cv; return cv;
  },
  _darken(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const r = ((n >> 16) & 255) * k | 0, g = ((n >> 8) & 255) * k | 0, b = (n & 255) * k | 0;
    return `rgb(${r},${g},${b})`;
  },
  // 별 배경 타일
  starTile(density, bright) {
    const key = `star_${density}_${bright}`;
    if (this.cache[key]) return this.cache[key];
    const s = 512, cv = document.createElement('canvas'); cv.width = cv.height = s;
    const x = cv.getContext('2d');
    for (let i = 0; i < density; i++) {
      const r = rand(0.5, 1.8), a = rand(0.2, bright);
      x.fillStyle = `rgba(${randi(150, 220)},${randi(200, 255)},255,${a})`;
      x.beginPath(); x.arc(rand(0, s), rand(0, s), r, 0, TAU); x.fill();
    }
    this.cache[key] = cv; return cv;
  },
};
