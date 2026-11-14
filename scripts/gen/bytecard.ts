import { config } from '../config.ts';
import { byte, stageFor, type Fx, type Mood } from '../lib/byte.ts';
import { doc, EASE, esc } from '../lib/svg.ts';
import type { Theme } from '../lib/theme.ts';
import { xpFor, LIMITS, type World } from '../lib/state.ts';

const MOOD_LINE: Record<Mood, string> = { happy: 'feeling great', idle: 'hanging out', sleepy: 'getting sleepy', sleeping: 'fast asleep until 7 am', hungry: 'tummy is rumbling', excited: 'bouncing off the walls', coding: 'coding with Nithin', celebrating: 'party time' };

export function byteCard(t: Theme, w: World, moodOverride?: Mood, look?: { stage?: number; wearing?: string | null }) {
  const W = 600, H = 300, b = w.byte, mood = moodOverride ?? b.mood;
  const by = byte({ t, mood, stage: look?.stage ?? stageFor(b.level), wearing: look?.wearing !== undefined ? look.wearing : b.accessories.wearing, x: 132, y: 248, scale: 1.3 });
  const next = b.level >= LIMITS.maxLevel ? 1 : (b.xp - xpFor(b.level)) / (xpFor(b.level + 1) - xpFor(b.level));
  const bars: [string, number, string][] = [['Happiness', b.happiness / 100, `${b.happiness}`], ['Energy', b.energy / 100, `${b.energy}`], ['Hunger', b.hunger / 100, `${b.hunger}`], ['XP', next, b.level >= LIMITS.maxLevel ? 'max' : `${b.xp - xpFor(b.level)} / ${xpFor(b.level + 1) - xpFor(b.level)}`]];
  const rows = bars.map(([label, v, text], i) => `<g transform="translate(286,${104 + i * 38})"><text y="0" font-size="15" class="s">${label}</text><text x="282" y="0" text-anchor="end" font-size="13" class="m s">${text}</text>
<rect y="8" width="282" height="12" rx="6" fill="${t.line}"/><rect class="bar" y="8" width="${Math.max(12, 282 * v).toFixed(0)}" height="12" rx="6" fill="${i === 3 ? t.ink : t.accent}" style="animation-delay:${0.15 + i * 0.12}s"/></g>`).join('');
  const css = `${by.css}.bar{transform-origin:286px 0;animation:fill 1.1s ${EASE.expo} both}@keyframes fill{from{transform:scaleX(0)}}
.lvl{transform-box:fill-box;transform-origin:center;animation:pop .7s ${EASE.spring} both}@keyframes pop{from{transform:scale(0)}}`;
  const body = `${by.svg}
<text x="286" y="52" font-size="30" class="b">${esc(b.name)}</text>
<g class="lvl"><rect x="${286 + 12 + b.name.length * 17}" y="28" width="74" height="30" rx="15" fill="${t.accent}"/><text x="${286 + 49 + b.name.length * 17}" y="49" text-anchor="middle" font-size="16" class="b" style="fill:${t.onAccent}">Lv ${b.level}</text></g>
<text x="286" y="78" font-size="15" class="s">${MOOD_LINE[mood]}</text>${rows}
<text x="286" y="276" font-size="14" class="m s">${b.pets.today} pets today  /  ${b.pets.total} all-time</text>`;
  return doc({ w: W, h: H, t, title: `${b.name} is ${MOOD_LINE[mood]}. Level ${b.level}. Happiness ${b.happiness}, energy ${b.energy}, hunger ${b.hunger}. ${b.pets.total} pets all-time.`, body, css, fonts: ['r', 'b', 'm'] });
}

const ICONS: Record<string, string> = {
  pet: 'M0,8 C-14,-4 -8,-15 0,-7 C8,-15 14,-4 0,8Z', feed: 'M-10,0 a10,10 0 1 0 20,0 a10,10 0 1 0 -20,0 M-4,-3 h.1 M4,-1 h.1 M-1,5 h.1',
  play: 'M-9,0 a9,9 0 1 0 18,0 a9,9 0 1 0 -18,0 M-9,0 q9,-7 18,0 M-9,0 q9,7 18,0', say: 'M-12,-9 h24 a3,3 0 0 1 3,3 v9 a3,3 0 0 1 -3,3 h-14 l-7,6 v-6 h-3 a3,3 0 0 1 -3,-3 v-9 a3,3 0 0 1 3,-3Z',
  dance: 'M-6,10 a4,4 0 1 0 0.1,0 M6,6 a4,4 0 1 0 0.1,0 M-2,10 v-18 l12,-4 v18', hat: 'M-8,-10 h16 v14 h-16Z M-13,4 h26',
};
export const BUTTONS = [
  { id: 'pet', label: 'Pet Byte', title: 'byte|pet' }, { id: 'feed', label: 'Feed Byte', title: 'byte|feed|cookie' }, { id: 'play', label: 'Play', title: 'byte|play' },
  { id: 'say', label: 'Say hi', title: 'byte|say|Hi Byte!' }, { id: 'dance', label: 'Dance', title: 'byte|dance' }, { id: 'hat', label: 'Give a hat', title: 'byte|accessory|hat' },
];
/** Small animated badge used as a button. Each one is its own SVG so the README can wrap it in its own link. */
export function button(t: Theme, id: string, label: string, n = 0) {
  const W = 190, H = 58;
  const css = `.ic{transform-box:fill-box;transform-origin:center;animation:wig 2.6s ${EASE.spring} ${n * 0.35}s infinite}@keyframes wig{0%,70%,100%{transform:none}78%{transform:rotate(-14deg) scale(1.15)}86%{transform:rotate(10deg) scale(1.15)}94%{transform:rotate(-4deg)}}
.sh{animation:sh 5s ${EASE.io} ${n * 0.5}s infinite}@keyframes sh{0%,60%{transform:translateX(-80px)}90%,100%{transform:translateX(260px)}}`;
  const body = `<clipPath id="c"><rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="27"/></clipPath><rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="27" fill="${t.card}" stroke="${t.ink}" stroke-width="3"/>
<g clip-path="url(#c)"><rect class="sh" x="0" y="0" width="34" height="${H}" fill="${t.accent}" opacity=".16" transform="skewX(-20)"/></g>
<circle cx="31" cy="29" r="19" fill="${t.accent}"/><g transform="translate(31,29)"><path class="ic" d="${ICONS[id]}" fill="${id === 'pet' ? t.onAccent : 'none'}" stroke="${t.onAccent}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></g>
<text x="${58 + (W - 70) / 2}" y="35.500" text-anchor="middle" font-size="18" class="b">${esc(label)}</text>`;
  return doc({ w: W, h: H, t, title: label, body, css, fonts: ['b'], frame: false });
}

const REACTIONS: Record<string, { mood: Mood | 'dance'; fx: Fx; caption: string }> = {
  pet: { mood: 'happy', fx: 'hearts', caption: 'purr.exe' }, feed: { mood: 'happy', fx: 'crumbs', caption: 'nom nom' }, play: { mood: 'excited', fx: 'ball', caption: 'again!' },
  dance: { mood: 'dance', fx: 'notes', caption: 'beep bop' }, say: { mood: 'happy', fx: 'hello', caption: 'message saved' }, hat: { mood: 'happy', fx: null, caption: 'looking sharp' },
  levelup: { mood: 'celebrating', fx: null, caption: 'level up!' }, think: { mood: 'idle', fx: null, caption: 'your move' }, oops: { mood: 'hungry', fx: null, caption: 'oops' }, sleepy: { mood: 'sleepy', fx: null, caption: 'so sleepy' },
};
export const REACTION_IDS = Object.keys(REACTIONS);
/** The little "GIF" Byte posts in its issue reply: a looping animated SVG. */
export function reaction(t: Theme, id: string, w: World) {
  const r = REACTIONS[id] ?? REACTIONS.think, W = 300, H = 250;
  const by = byte({ t, mood: r.mood, fx: r.fx, stage: stageFor(w.byte.level), wearing: w.byte.accessories.wearing, x: 150, y: 208, scale: 1.05 });
  return doc({ w: W, h: H, t, title: `${config.buddy}: ${r.caption}`, css: by.css, body: `${by.svg}<text x="150" y="238" text-anchor="middle" font-size="15" class="m s">${esc(r.caption)}</text>`, fonts: ['b', 'm'] });
}
