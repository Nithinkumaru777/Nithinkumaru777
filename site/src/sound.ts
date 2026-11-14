/** Tiny synthesized beeps. Off by default; nothing loads until the visitor turns sound on. */
let ctx: AudioContext | null = null, on = false;
const KEY = 'byte-sound';
try { on = localStorage.getItem(KEY) === 'on'; } catch { /* storage can be unavailable */ }
export const soundOn = () => on;
export function setSound(v: boolean) { on = v; try { localStorage.setItem(KEY, v ? 'on' : 'off'); } catch { /* ignore */ } if (v) ctx ??= new AudioContext(); }
export function beep(kind: 'pet' | 'nom' | 'boing' | 'hop' | 'talk' | 'yawn' | 'dance') {
  if (!on) return;
  ctx ??= new AudioContext();
  const notes: Record<typeof kind, [number, number][]> = { pet: [[880, 0.06], [1175, 0.08]], nom: [[330, 0.05], [262, 0.05], [330, 0.05]], boing: [[220, 0.04], [440, 0.1]], hop: [[660, 0.05]], talk: [[740, 0.04], [620, 0.04], [820, 0.05]], yawn: [[440, 0.18], [330, 0.25]], dance: [[523, 0.07], [659, 0.07], [784, 0.07], [1047, 0.1]] };
  let t = ctx.currentTime;
  for (const [f, d] of notes[kind]) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + d + 0.02); t += d * 0.9;
  }
}
