'use strict';
// Keyboard and touch input adapter.
/* ---------------- 입력 ---------------- */
function bindKeyboardInput(input) {
  addEventListener('keydown', e => {
    const game = typeof GameRuntime !== 'undefined' ? GameRuntime.activeGame() : null;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    if (e.key === 'Tab' && game && ['play', 'pause', 'levelup'].includes(game.state)) e.preventDefault();
    input.keys[e.key.toLowerCase()] = true;
    if (typeof GameRuntime !== 'undefined') {
      if (game && typeof game.onKey === 'function') game.onKey(e.key.toLowerCase(), e);
    }
  });
  addEventListener('keyup', e => { input.keys[e.key.toLowerCase()] = false; });
  addEventListener('blur', () => {
    input.keys = {};
    if (typeof GameRuntime !== 'undefined') GameRuntime.pauseForHiddenDocument();
  });
}

function bindVisibilityAudioPause() {
  document.addEventListener('visibilitychange', () => {
    if (typeof GameRuntime === 'undefined') return;
    if (document.hidden) GameRuntime.pauseForHiddenDocument();
    else GameRuntime.resumeForVisibleDocument();
  });
}

function touchJoystickMetrics(joy) {
  const joySize = parseFloat(getComputedStyle(joy).width) || 120;
  return {
    radius: joySize / 2,
    max: Math.max(24, Math.min(52, joySize / 2 - 8)),
    dead: Math.max(6, Math.min(10, joySize * 0.07)),
  };
}

function touchJoystickBase(touch, padRect, metrics) {
  const clampCenter = (v, min, max) => min > max ? (min + max) / 2 : clamp(v, min, max);
  if (!padRect) return { x: touch.clientX, y: touch.clientY, inPad: false };
  const inPad = touch.clientX >= padRect.left && touch.clientX <= padRect.right && touch.clientY >= padRect.top && touch.clientY <= padRect.bottom;
  if (!inPad) return { x: touch.clientX, y: touch.clientY, inPad: false };
  const insetX = Math.min(metrics.radius + 4, Math.max(8, padRect.width / 2 - 2));
  const insetY = Math.min(metrics.radius + 4, Math.max(8, padRect.height / 2 - 2));
  return {
    x: clampCenter(touch.clientX, padRect.left + insetX, padRect.right - insetX),
    y: clampCenter(touch.clientY, padRect.top + insetY, padRect.bottom - insetY),
    inPad: true,
  };
}

function bindTouchJoystick(input) {
  const joy = $('joy'), knob = $('knob'), pad = $('movePad');
  let touchId = null, baseX = 0, baseY = 0;
  const coarse = () => typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;

  const startTouch = touch => {
    if (touchId !== null) return false;
    if (touch.target.closest('.overlay') || touch.target.closest('button')) return false;
    const metrics = touchJoystickMetrics(joy);
    const base = touchJoystickBase(touch, pad ? pad.getBoundingClientRect() : null, metrics);
    touchId = touch.identifier;
    baseX = base.x; baseY = base.y;
    joy.style.display = 'block';
    joy.style.left = (baseX - metrics.radius) + 'px';
    joy.style.top = (baseY - metrics.radius) + 'px';
    joy.style.opacity = coarse() && base.inPad ? 1 : 0.72;
    knob.style.transform = 'translate(-50%,-50%)';
    input.joyActive = true; input.joyVX = 0; input.joyVY = 0;
    return true;
  };

  const moveTouch = touch => {
    if (touch.identifier !== touchId) return false;
    let dx = touch.clientX - baseX, dy = touch.clientY - baseY;
    const metrics = touchJoystickMetrics(joy);
    const len = Math.hypot(dx, dy), max = metrics.max;
    if (len > max) { dx = dx / len * max; dy = dy / len * max; }
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    input.joyVX = len > metrics.dead ? dx / max : 0;
    input.joyVY = len > metrics.dead ? dy / max : 0;
    return true;
  };

  const endTouch = touch => {
    if (touch.identifier !== touchId) return false;
    touchId = null; input.joyActive = false; input.joyVX = 0; input.joyVY = 0;
    joy.style.display = 'none';
    return true;
  };

  addEventListener('touchstart', e => { for (const t of e.changedTouches) if (startTouch(t)) e.preventDefault(); }, { passive: false });
  addEventListener('touchmove', e => { for (const t of e.changedTouches) if (moveTouch(t)) e.preventDefault(); }, { passive: false });
  addEventListener('touchend', e => { for (const t of e.changedTouches) endTouch(t); });
  addEventListener('touchcancel', e => { for (const t of e.changedTouches) endTouch(t); });
}

const Input = {
  keys: {}, mx: 0, my: 0,
  joyActive: false, joyVX: 0, joyVY: 0,
  init() {
    bindKeyboardInput(this);
    bindVisibilityAudioPause();
    bindTouchJoystick(this);
  },
  installSimMoveVec(fn) {
    return InputVectorState.installOverride(this, fn);
  },

  // 이동 벡터 (-1~1)
  moveVec() {
    return InputVectorState.compute({
      keys: this.keys,
      joyActive: this.joyActive,
      joyVX: this.joyVX,
      joyVY: this.joyVY,
      override: this.simMoveVec,
    });
  }
};
