// Synthesised casino sound effects using WebAudio — zero asset files.
// All sounds are procedurally generated on-demand from a single shared AudioContext.

let ctx: AudioContext | null = null;
const getCtx = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return ctx;
};

const envelope = (
  _c: AudioContext,
  node: GainNode,
  peak: number,
  attack: number,
  release: number,
  start: number,
) => {
  node.gain.setValueAtTime(0, start);
  node.gain.linearRampToValueAtTime(peak, start + attack);
  node.gain.exponentialRampToValueAtTime(0.0001, start + attack + release);
};

const tone = (
  type: OscillatorType,
  freq: number,
  duration: number,
  gain = 0.2,
  freqEnd?: number,
) => {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  if (freqEnd !== undefined)
    osc.frequency.exponentialRampToValueAtTime(freqEnd, c.currentTime + duration);
  osc.connect(g);
  g.connect(c.destination);
  envelope(c, g, gain, 0.01, duration, c.currentTime);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + duration + 0.05);
};

// Short noisy burst — for dice clatter, card shuffle.
const noise = (duration: number, gain = 0.15, filterFreq = 2000) => {
  const c = getCtx();
  if (!c) return;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * duration), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.8;
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  const g = c.createGain();
  src.connect(filter);
  filter.connect(g);
  g.connect(c.destination);
  envelope(c, g, gain, 0.005, duration, c.currentTime);
  src.start(c.currentTime);
};

export const sfx = {
  diceRoll: () => {
    // 4 quick clatters
    for (let i = 0; i < 6; i++) {
      setTimeout(() => noise(0.06, 0.2, 800 + Math.random() * 600), i * 80);
    }
  },
  cardFlip: () => {
    noise(0.12, 0.15, 3000);
    setTimeout(() => tone('triangle', 600, 0.06, 0.12), 60);
  },
  coinFlip: () => {
    tone('square', 1200, 0.05, 0.08, 1800);
    setTimeout(() => tone('square', 1100, 0.05, 0.08, 1600), 80);
  },
  slotStop: () => {
    tone('square', 400, 0.04, 0.18, 220);
  },
  chipClink: () => {
    tone('triangle', 2400, 0.08, 0.15, 1600);
    setTimeout(() => tone('triangle', 2200, 0.06, 0.12, 1400), 40);
  },
  win: () => {
    // Ascending cheer
    const notes = [523, 659, 784, 1046]; // C5 E5 G5 C6
    notes.forEach((n, i) => setTimeout(() => tone('triangle', n, 0.2, 0.18), i * 90));
  },
  lose: () => {
    tone('sawtooth', 220, 0.3, 0.14, 100);
  },
  button: () => {
    tone('square', 1000, 0.03, 0.08);
  },
};

// Resume context after first user interaction (browsers block autoplay)
export const primeAudio = () => {
  const c = getCtx();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
};
