'use strict';
// Spatial hash grid for enemy collision and area queries.
/* ---------- 공간 해시 그리드 ---------- */
const Grid = {
  cell: 76, map: new Map(),
  key(cx, cy) { return (cx + 32768) + (cy + 32768) * 65536; },
  rebuild(enemies) {
    this.map.clear();
    for (const e of enemies) {
      const k = this.key(Math.floor(e.x / this.cell), Math.floor(e.y / this.cell));
      let arr = this.map.get(k);
      if (!arr) { arr = []; this.map.set(k, arr); }
      arr.push(e);
    }
  },
  forEachInCircle(x, y, r, fn) {
    const c = this.cell;
    const x0 = Math.floor((x - r) / c), x1 = Math.floor((x + r) / c);
    const y0 = Math.floor((y - r) / c), y1 = Math.floor((y + r) / c);
    const rr = r + 30, r2 = rr * rr;
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
      const arr = this.map.get(this.key(cx, cy));
      if (!arr) continue;
      for (let i = 0; i < arr.length; i++) {
        const e = arr[i];
        const dx = x - e.x, dy = y - e.y;
        if (dx * dx + dy * dy <= r2) fn(e);
      }
    }
  },
  forEachInCircleD2(x, y, r, fn) {
    const c = this.cell;
    const x0 = Math.floor((x - r) / c), x1 = Math.floor((x + r) / c);
    const y0 = Math.floor((y - r) / c), y1 = Math.floor((y + r) / c);
    const r2 = r * r;
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
      const arr = this.map.get(this.key(cx, cy));
      if (!arr) continue;
      for (let i = 0; i < arr.length; i++) {
        const e = arr[i];
        const dx = x - e.x, dy = y - e.y;
        const d2 = dx * dx + dy * dy;
        if (d2 <= r2) fn(e, d2);
      }
    }
  },
  forEachInRect(l, t, r, b, fn) {
    const c = this.cell;
    const x0 = Math.floor(l / c), x1 = Math.floor(r / c);
    const y0 = Math.floor(t / c), y1 = Math.floor(b / c);
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
      const arr = this.map.get(this.key(cx, cy));
      if (!arr) continue;
      for (let i = 0; i < arr.length; i++) fn(arr[i]);
    }
  },
  forEachInBeam(x, y, dx, dy, len, halfWidth, fn) {
    const endX = x + dx * len, endY = y + dy * len;
    const pad = halfWidth + 76;
    this.forEachInRect(
      Math.min(x, endX) - pad,
      Math.min(y, endY) - pad,
      Math.max(x, endX) + pad,
      Math.max(y, endY) + pad,
      e => {
        const ex = e.x - x, ey = e.y - y;
        const along = ex * dx + ey * dy;
        if (along < 0 || along > len) return;
        const perp = Math.abs(ex * dy - ey * dx);
        if (perp <= halfWidth + e.r) fn(e, along, perp);
      }
    );
  },
  separate(e) {
    const arr = this.map.get(this.key(Math.floor(e.x / this.cell), Math.floor(e.y / this.cell)));
    if (!arr || arr.length < 2) return;
    let checked = 0;
    for (let i = 0; i < arr.length && checked < 5; i++) {
      const o = arr[i];
      if (o === e) continue;
      checked++;
      const dx = e.x - o.x, dy = e.y - o.y;
      const d2 = dx * dx + dy * dy, min = (e.r + o.r) * 0.82;
      if (d2 > 0.01 && d2 < min * min) {
        const d = Math.sqrt(d2), push = (min - d) * 0.4;
        e.x += dx / d * push; e.y += dy / d * push;
      }
    }
  },
};
