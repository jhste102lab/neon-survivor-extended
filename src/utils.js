'use strict';
// Shared math, random, and DOM helpers.
/* ---------------- 유틸 ---------------- */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const RNG = {
  seed: 0,
  seeded: false,
  setSeed(seed) { this.seed = (seed >>> 0) || 1; this.seeded = true; },
  clearSeed() { this.seeded = false; },
  next() {
    if (!this.seeded) return Math.random();
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 4294967296;
  },
};
const rand = (a, b) => a + RNG.next() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = arr => arr[(RNG.next() * arr.length) | 0];
const dist2 = (ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay; return dx * dx + dy * dy; };
function weightedPick(items) { // items: [{w, ...}]
  let sum = 0; for (const it of items) sum += it.w;
  let r = RNG.next() * sum;
  for (const it of items) { r -= it.w; if (r <= 0) return it; }
  return items[items.length - 1];
}
const fmtTime = s => { s = Math.max(0, Math.floor(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
const $ = id => document.getElementById(id);
