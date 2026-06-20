'use strict';
// Mute persistence and button presentation adapter for the audio runtime.
const AudioMuteState = {
  storageKey: 'ns_mute',

  load() {
    try { return localStorage.getItem(this.storageKey) === '1'; } catch (e) { return false; }
  },

  save(muted) {
    try { localStorage.setItem(this.storageKey, muted ? '1' : '0'); } catch (e) {}
  },

  renderButton(muted) {
    const btn = typeof document !== 'undefined' ? document.getElementById('btnMute') : null;
    if (btn) btn.textContent = muted ? '🔇' : '🔊';
  },

  apply(audio, muted) {
    audio.muted = !!muted;
    if (audio.master) audio.master.gain.value = muted ? 0 : 0.8;
    this.renderButton(!!muted);
    this.save(!!muted);
  },
};
