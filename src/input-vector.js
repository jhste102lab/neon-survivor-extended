'use strict';
// Pure movement-vector state and simulation override helpers.
const InputVectorState = {
  compute(state = {}) {
    if (typeof state.override === 'function') return state.override();
    const keys = state.keys || {};
    let x = 0, y = 0;
    if (keys.w || keys.arrowup || keys['ㅈ']) y -= 1;
    if (keys.s || keys.arrowdown || keys['ㄴ']) y += 1;
    if (keys.a || keys.arrowleft || keys['ㅁ']) x -= 1;
    if (keys.d || keys.arrowright || keys['ㅇ']) x += 1;
    if (state.joyActive) {
      x += Number(state.joyVX || 0);
      y += Number(state.joyVY || 0);
    }
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    return { x, y };
  },

  installOverride(target, override) {
    if (!target) return () => {};
    const previous = target.simMoveVec || null;
    target.simMoveVec = typeof override === 'function' ? override : null;
    let restored = false;
    return () => {
      if (restored) return;
      restored = true;
      target.simMoveVec = previous;
    };
  },
};
