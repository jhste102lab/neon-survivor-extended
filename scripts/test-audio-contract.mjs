#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(new URL('..', import.meta.url).pathname);

class FakeParam {
  constructor(value = 0) { this.value = value; }
  setValueAtTime(value) { this.value = value; }
  linearRampToValueAtTime(value) { this.value = value; }
  exponentialRampToValueAtTime(value) { this.value = value; }
}
class FakeNode {
  constructor() { this.connections = []; }
  connect(node) { this.connections.push(node); return node; }
}
class FakeGain extends FakeNode { constructor() { super(); this.gain = new FakeParam(); } }
class FakeCompressor extends FakeNode { constructor() { super(); this.threshold = new FakeParam(); this.knee = new FakeParam(); this.ratio = new FakeParam(); } }
class FakeDelay extends FakeNode { constructor() { super(); this.delayTime = new FakeParam(); } }
class FakeOscillator extends FakeNode { constructor() { super(); this.frequency = new FakeParam(); this.type = 'sine'; this.started = false; this.stopped = false; } start() { this.started = true; } stop() { this.stopped = true; } }
class FakeFilter extends FakeNode { constructor() { super(); this.frequency = new FakeParam(); this.Q = new FakeParam(); this.type = 'highpass'; } }
class FakeBufferSource extends FakeNode { constructor() { super(); this.buffer = null; this.loop = false; } start() {} stop() {} }
class FakeAudioContext {
  constructor() { this.sampleRate = 8000; this.currentTime = 0; this.state = 'running'; this.destination = new FakeNode(); }
  createGain() { return new FakeGain(); }
  createDynamicsCompressor() { return new FakeCompressor(); }
  createDelay() { return new FakeDelay(); }
  createBuffer(channels, len) { return { channels, len, getChannelData: () => new Float32Array(len) }; }
  createOscillator() { return new FakeOscillator(); }
  createBiquadFilter() { return new FakeFilter(); }
  createBufferSource() { return new FakeBufferSource(); }
  resume() { this.state = 'running'; }
  suspend() { this.state = 'suspended'; }
}

const button = { textContent: '' };
const storage = new Map();
const context = vm.createContext({
  console,
  Math,
  Date,
  performance: { now: () => 1000 },
  window: { AudioContext: FakeAudioContext },
  document: { hidden: false, getElementById: id => (id === 'btnMute' ? button : null) },
  localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, String(value)) },
  Game: { test: { headless: false, noFx: false }, state: 'play' },
  RNG: { next: () => 0.5 },
  rand: (a, b) => (a + b) / 2,
  clamp: (n, a, b) => Math.min(b, Math.max(a, n)),
  setInterval,
  clearInterval,
});

function loadClassic(file) {
  vm.runInContext(readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}
function getGlobal(name) { return vm.runInContext(name, context); }
function assert(condition, message) { if (!condition) throw new Error(message); }

loadClassic('src/music.js');
loadClassic('src/audio-mute.js');
loadClassic('src/audio-engine.js');
loadClassic('src/audio-sfx-catalog.js');
loadClassic('src/audio-fx.js');

const AudioFX = getGlobal('AudioFX');
const Music = getGlobal('Music');

assert(AudioFX.ensure() === true, 'AudioFX.ensure should create a graph with fake AudioContext');
assert(AudioFX.ac instanceof FakeAudioContext, 'AudioFX owns created AudioContext');
assert(AudioFX.master && AudioFX.sfxGain && AudioFX.musGain && AudioFX.delay, 'AudioEngine creates graph nodes');
assert(Music.graph && Music.graph !== AudioFX, 'Music receives an explicit graph object, not the AudioFX facade');
assert(Music.graph.ac === AudioFX.ac && Music.graph.musGain === AudioFX.musGain && Music.graph.noiseBuffer === AudioFX._noiseBuf, 'Music graph exposes stable audio dependencies');

vm.runInContext("AudioSfxCatalog.uiClick = audio => { audio.__catalogHit = 'uiClick'; };", context);
AudioFX.uiClick();
assert(AudioFX.__catalogHit === 'uiClick', 'AudioFX public SFX wrappers delegate to AudioSfxCatalog');

AudioFX.setMuted(true);
assert(AudioFX.muted === true && AudioFX.master.gain.value === 0 && button.textContent === '🔇' && storage.get('ns_mute') === '1', 'mute state updates graph, button, and storage');
AudioFX.setMuted(false);
assert(AudioFX.muted === false && AudioFX.master.gain.value === 0.8 && button.textContent === '🔊' && storage.get('ns_mute') === '0', 'unmute state updates graph, button, and storage');

console.log('Audio graph/SFX/mute contract tests passed.');
