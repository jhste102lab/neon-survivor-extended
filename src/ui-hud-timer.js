'use strict';
// Survival timer checkpoint math and timer text rendering.
const UIHudTimer = {
  timeCheckpoint(time) {
    const unlock = CFG.unlockTime || CFG.winTime;
    const loop = CFG.winTime || unlock;
    if (time < unlock) return { target: unlock, label: tr('timer.checkpoint') };
    if (time < loop) return { target: loop, label: tr('timer.loopStart') };
    const span = CFG.checkpointInterval || 300;
    const target = loop + (Math.floor((time - loop) / span) + 1) * span;
    return { target, label: tr('timer.nextLoop') };
  },

  updateTimer(time) {
    const cp = UI.timeCheckpoint(time);
    const now = $('timeNow'), goal = $('timeGoal'), mark = $('timeMark'), timer = $('timer');
    if (now && goal) {
      now.textContent = fmtTime(time);
      goal.textContent = ` / ${fmtTime(cp.target)}`;
      if (mark) mark.textContent = cp.label;
    } else if (timer) {
      timer.textContent = `${fmtTime(time)} / ${fmtTime(cp.target)}`;
    }
  },
};
