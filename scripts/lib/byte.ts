import type { Theme } from './theme.ts';
import { EASE } from './ease.ts';

export const MOODS = ['happy', 'idle', 'sleepy', 'sleeping', 'hungry', 'excited', 'coding', 'celebrating'] as const;
export type Mood = (typeof MOODS)[number];
export type Fx = 'hearts' | 'crumbs' | 'notes' | 'ball' | 'hello' | null;
export interface ByteOpts {
  t: Theme; mood: Mood | 'dance';
  /** Evolution stage: 0 below level 5, 1 from level 5 (second antenna), 2 from level 10 (chest light), 3 at level 20 (cape). */
  stage?: number; wearing?: string | null; wave?: boolean; fx?: Fx;
  x: number; y: number; scale?: number;
  /** Class prefix. Change it when two Bytes share one SVG. */
  id?: string;
}
export const stageFor = (level: number) => (level >= 20 ? 3 : level >= 10 ? 2 : level >= 5 ? 1 : 0);

/**
 * The one place Byte is drawn. Body, eyes, mouth, accessories and effects are composed from the mood,
 * the accessory and the evolution stage, so every combination stays consistent.
 * Local coordinates: the origin is between the feet, y grows downward, the body is about 104 × 126.
 */
export function byte(o: ByteOpts): { css: string; svg: string } {
  const { t, mood, stage = 0, wearing = null, wave = false, fx = null, x, y, scale = 1, id = 'by' } = o;
  const p = id, ink = t.ink, sw = 3.5;
  const st = `stroke="${ink}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"`;
  const asleep = mood === 'sleeping', glee = mood === 'excited' || mood === 'celebrating' || mood === 'dance';
  const hat = wearing === 'hat', party = mood === 'celebrating';

  // ── parts ──────────────────────────────────────────────────────────
  const cape = stage >= 3 ? `<path class="${p}-cape" d="M-38,-84 C-74,-46 -70,-14 -62,-4 L62,-4 C70,-14 74,-46 38,-84Z" fill="${t.accent}" ${st}/>` : '';
  const feet = `<rect x="-31" y="-11" width="24" height="13" rx="6.5" fill="${t.shade}" ${st}/><rect x="7" y="-11" width="24" height="13" rx="6.5" fill="${t.shade}" ${st}/>`;
  const arm = (side: 'L' | 'R') => `<g class="${p}-arm${side}"><rect x="${side === 'L' ? -69 : 51}" y="-68" width="18" height="34" rx="9" fill="${t.shell}" ${st}/></g>`;
  const body = `<rect x="-52" y="-106" width="104" height="100" rx="42" fill="${t.shell}" ${st}/><path d="M-49,-44 C-47,-16 -28,-9 0,-9 C28,-9 47,-16 49,-44 C38,-24 -38,-24 -49,-44Z" fill="${t.shade}"/>`
    + (stage >= 2 ? `<rect class="${p}-core" x="-13" y="-24" width="26" height="10" rx="5" fill="${t.accent}" ${st}/>` : '');
  const screen = `<rect x="-38" y="-93" width="76" height="52" rx="20" fill="${t.screen}"/>`;

  const eye = (cx: number, n: number) => {
    if (asleep) return `<path d="M${cx - 8},-66 q8,7 16,0" fill="none" stroke="${t.eye}" stroke-width="3.2" stroke-linecap="round"/>`;
    if (glee) return `<path d="M${cx - 8},-62 q8,-10 16,0" fill="none" stroke="${t.eye}" stroke-width="3.6" stroke-linecap="round"/>`;
    return `<g class="${p}-eye ${p}-eye${n}"><ellipse cx="${cx}" cy="-66" rx="7.5" ry="9.5" fill="${t.eye}"/><circle cx="${cx + 2.6}" cy="-70" r="2.5" fill="${t.screen}"/><circle cx="${cx - 2.4}" cy="-62.5" r="1.2" fill="${t.screen}"/></g>`;
  };
  const mouths: Record<string, string> = {
    idle: `<path d="M-6,-51 q6,5 12,0" fill="none" stroke="${t.eye}" stroke-width="2.8" stroke-linecap="round"/>`,
    happy: `<path d="M-8,-53 q8,11 16,0Z" fill="${t.accent}" stroke="${t.eye}" stroke-width="2.4" stroke-linejoin="round"/>`,
    sleepy: `<ellipse class="${p}-yawn" cx="0" cy="-50" rx="4.5" ry="5" fill="${t.accent}" stroke="${t.eye}" stroke-width="2.2"/>`,
    sleeping: `<ellipse cx="0" cy="-50" rx="2.6" ry="2.2" fill="${t.eye}"/>`,
    hungry: `<path d="M-9,-49 q4.500,-5 9,0 t9,0" fill="none" stroke="${t.eye}" stroke-width="2.8" stroke-linecap="round"/>`,
    coding: `<path d="M-5,-50 h10" stroke="${t.eye}" stroke-width="2.8" stroke-linecap="round"/>`,
  };
  const mouth = mouths[glee ? 'happy' : mood] ?? mouths.idle;
  const blush = `<ellipse cx="-28" cy="-51" rx="6" ry="3.4" fill="${t.accent}" opacity=".6"/><ellipse cx="28" cy="-51" rx="6" ry="3.4" fill="${t.accent}" opacity=".6"/>`;
  const shades = wearing === 'shades' ? `<g><rect x="-31" y="-76" width="27" height="17" rx="6.5" fill="${t.accent}" stroke="${t.eye}" stroke-width="2.4"/><rect x="4" y="-76" width="27" height="17" rx="6.5" fill="${t.accent}" stroke="${t.eye}" stroke-width="2.4"/><path d="M-4,-69 h8" stroke="${t.eye}" stroke-width="2.4"/><path d="M-25,-64 l7,-8 M10,-64 l7,-8" stroke="${t.eye}" stroke-width="2" stroke-linecap="round" opacity=".7"/></g>` : '';
  const bow = wearing === 'bow' ? `<path d="M0,-37 l-13,-7 v14Z M0,-37 l13,-7 v14Z" fill="${t.accent}" ${st}/><circle cx="0" cy="-37" r="3.4" fill="${t.accent}" ${st}/>` : '';

  const hatFill = t.mode === 'light' ? ink : '#3A2D22';
  const lift = hat || party ? -22 : 0;
  const antenna = `<g class="${p}-ant" transform="translate(0,${lift})"><path d="M0,-106 v-15" fill="none" ${st}/><circle cx="0" cy="-127" r="6.5" fill="${t.accent}" ${st}/>${stage >= 1 ? `<path d="M0,-112 q11,-4 14,-13" fill="none" ${st}/><circle cx="15" cy="-128" r="4" fill="${t.shell}" ${st}/>` : ''}</g>`;
  const topHat = hat && !party ? `<g><rect x="-21" y="-131" width="42" height="24" rx="5" fill="${hatFill}" ${st}/><rect x="-21" y="-116" width="42" height="6" fill="${t.accent}"/><rect x="-32" y="-110" width="64" height="8" rx="4" fill="${hatFill}" ${st}/></g>` : '';
  const partyHat = party ? `<g class="${p}-ph"><path d="M-17,-103 L0,-142 L17,-103Z" fill="${t.accent}" ${st}/><path d="M-10,-119 l15,-6 M-14,-109 l23,-9" stroke="${t.eye}" stroke-width="3" stroke-linecap="round"/><circle cx="0" cy="-143" r="5" fill="${t.eye}" ${st}/></g>` : '';

  const laptop = mood === 'coding' ? `<g><rect x="-31" y="-36" width="62" height="36" rx="6" fill="${ink}" ${st}/><rect x="-25" y="-30" width="50" height="23" rx="3" fill="${t.mode === 'light' ? '#3A2D22' : '#0F0C0A'}"/>
    <rect class="${p}-code ${p}-c1" x="-21" y="-26" width="22" height="3" rx="1.5" fill="${t.accent}"/><rect class="${p}-code ${p}-c2" x="-21" y="-20" width="34" height="3" rx="1.5" fill="${t.eye}"/><rect class="${p}-code ${p}-c3" x="-21" y="-14" width="16" height="3" rx="1.5" fill="${t.eye}"/>
    <rect x="-40" y="-2" width="80" height="7" rx="3.5" fill="${t.shade}" ${st}/></g>` : '';

  // ── effects ────────────────────────────────────────────────────────
  const zz = asleep ? [0, 1, 2].map((i) => `<text class="${p}-z ${p}-z${i}" x="${44 + i * 13}" y="${-104 - i * 15}" font-size="${15 + i * 5}" font-weight="600" fill="${t.accent}">z</text>`).join('') : '';
  const star = (cx: number, cy: number, r: number, n: number) => `<path class="${p}-tw ${p}-tw${n}" d="M${cx},${cy - r} q${r * 0.18},${r * 0.82} ${r},${r} q${-r * 0.82},${r * 0.18} ${-r},${r} q${-r * 0.18},${-r * 0.82} ${-r},${-r} q${r * 0.82},${-r * 0.18} ${r},${-r}Z" fill="${t.accent}"/>`;
  const sparkles = mood === 'happy' ? star(-64, -112, 8, 0) + star(66, -96, 6, 1) + star(52, -132, 5, 2) : '';
  const bits = glee && mood !== 'dance' ? Array.from({ length: 12 }, (_, i) => `<rect class="${p}-cf ${p}-cf${i % 4}" x="${-82 + i * 15}" y="${-168 - (i % 3) * 14}" width="7" height="11" rx="2" fill="${[t.accent, ink, t.shade, t.soft][i % 4]}" style="animation-delay:${(i * 0.23).toFixed(2)}s"/>`).join('') : '';
  const rumble = mood === 'hungry' ? `<path class="${p}-rm" d="M-66,-30 q-6,6 0,12 M66,-30 q6,6 0,12 M-74,-34 q-7,10 0,20" fill="none" stroke="${t.accent}" stroke-width="3" stroke-linecap="round"/>` : '';
  const heart = (hx: number, n: number) => `<g transform="translate(${hx},-128) scale(1.5)"><path class="${p}-fx ${p}-fx${n}" d="M0,5 C-9,-3 -5,-10 0,-5 C5,-10 9,-3 0,5Z" fill="${t.accent}" stroke="${ink}" stroke-width="1.6"/></g>`;
  const fxSvg = fx === 'hearts' ? heart(-40, 0) + heart(4, 1) + heart(44, 2)
    : fx === 'crumbs' ? `<g class="${p}-fx ${p}-fx0"><circle cx="70" cy="-70" r="15" fill="${t.shade}" ${st}/><circle cx="65" cy="-74" r="2.4" fill="${ink}"/><circle cx="74" cy="-66" r="2.4" fill="${ink}"/><circle cx="71" cy="-77" r="2" fill="${ink}"/></g>`
    : fx === 'notes' ? [0, 1, 2].map((n) => `<g transform="translate(${-58 + n * 54},${-132 - (n % 2) * 12})"><path class="${p}-fx ${p}-fx${n}" d="M-5,8 a5,4 0 1 0 0.1,0 M0,8 v-20 l10,-3 v6 l-10,3" fill="${t.accent}" stroke="${t.accent}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/></g>`).join('')
    : fx === 'ball' ? `<circle class="${p}-ball" cx="78" cy="-14" r="13" fill="${t.accent}" ${st}/>`
    : fx === 'hello' ? `<g class="${p}-fx ${p}-fx0"><rect x="44" y="-150" width="62" height="30" rx="14" fill="${t.card}" ${st}/><text x="75" y="-129" text-anchor="middle" font-size="16" font-weight="600" fill="${ink}">hi!</text></g>` : '';

  // ── motion ─────────────────────────────────────────────────────────
  const loop: Record<string, string> = {
    idle: `.${p}-root{animation:${p}-breathe 4.2s ${EASE.io} infinite}`,
    happy: `.${p}-root{animation:${p}-bounce 1.7s ${EASE.io} infinite}.${p}-tw{transform-box:fill-box;transform-origin:center;animation:${p}-twinkle 1.7s ${EASE.io} infinite}.${p}-tw1{animation-delay:.5s}.${p}-tw2{animation-delay:1s}`,
    sleepy: `.${p}-root{animation:${p}-droop 6s ${EASE.io} infinite}.${p}-eye{transform-box:fill-box;transform-origin:center;animation:${p}-heavy 6s ${EASE.io} infinite}.${p}-yawn{transform-box:fill-box;transform-origin:center;animation:${p}-yawn 6s ${EASE.io} infinite}`,
    sleeping: `.${p}-root{animation:${p}-breathe 5.4s ${EASE.io} infinite}.${p}-z{animation:${p}-zz 3.6s ${EASE.out} infinite}.${p}-z1{animation-delay:1.2s}.${p}-z2{animation-delay:2.4s}`,
    hungry: `.${p}-root{animation:${p}-rumble 2.6s ${EASE.io} infinite}.${p}-rm{animation:${p}-pulse 2.6s ${EASE.io} infinite}`,
    excited: `.${p}-root{transform-origin:0 -56px;animation:${p}-spin 2.4s ${EASE.io} infinite}`,
    dance: `.${p}-root{animation:${p}-dance 1.2s ${EASE.io} infinite}.${p}-armL{animation:${p}-up 1.2s ${EASE.io} infinite}.${p}-armR{animation:${p}-up 1.2s ${EASE.io} -.6s infinite}`,
    coding: `.${p}-root{animation:${p}-breathe 3s ${EASE.io} infinite}.${p}-eyes{transform:translateY(5px)}.${p}-armL{animation:${p}-tap .34s ${EASE.io} infinite}.${p}-armR{animation:${p}-tap .34s ${EASE.io} -.17s infinite}.${p}-code{animation:${p}-type 2.4s steps(1) infinite}.${p}-c2{animation-delay:.6s}.${p}-c3{animation-delay:1.2s}`,
    celebrating: `.${p}-root{animation:${p}-bounce 1.4s ${EASE.io} infinite}.${p}-armL,.${p}-armR{animation:${p}-cheer .7s ${EASE.io} infinite alternate}`,
  };
  const css = `
.${p}-armL{transform-origin:-60px -62px}.${p}-armR{transform-origin:60px -62px}.${p}-ant{transform-origin:0 -106px;animation:${p}-wob 3.1s ${EASE.io} infinite}
.${p}-eye{transform-box:fill-box;transform-origin:center;animation:${p}-blink 9s linear infinite}.${p}-eye1{animation-delay:.04s}
.${p}-cape{transform-origin:0 -84px;animation:${p}-flap 2.8s ${EASE.io} infinite}.${p}-core{animation:${p}-pulse 2s ${EASE.io} infinite}
.${p}-cf{animation:${p}-fall 2.8s linear infinite;opacity:0}.${p}-fx{animation:${p}-rise 2.4s ${EASE.out} infinite;opacity:0}.${p}-fx1{animation-delay:.5s}.${p}-fx2{animation-delay:1s}
.${p}-ball{animation:${p}-ball 1.2s ${EASE.io} infinite}
${wave ? `.${p}-armR{animation:${p}-wave 2.6s ${EASE.io} infinite}` : ''}
${loop[mood] ?? loop.idle}
@keyframes ${p}-breathe{50%{transform:scale(1.018,.982)}}
@keyframes ${p}-bounce{0%,100%{transform:none}12%{transform:scale(1.09,.9)}38%{transform:translateY(-24px) scale(.95,1.07)}58%{transform:scale(1.1,.88)}72%{transform:scale(.98,1.03)}86%{transform:none}}
@keyframes ${p}-spin{0%,100%{transform:none}10%{transform:translateY(8px) scale(1.08,.9)}55%{transform:translateY(-34px) rotate(360deg)}70%{transform:translateY(4px) rotate(360deg) scale(1.08,.92)}82%{transform:rotate(360deg)}}
@keyframes ${p}-dance{0%,100%{transform:rotate(-7deg)}25%{transform:translateY(-10px)}50%{transform:rotate(7deg)}75%{transform:translateY(-10px)}}
@keyframes ${p}-droop{0%,100%{transform:none}50%{transform:rotate(5deg) translateY(2px)}}
@keyframes ${p}-heavy{0%,100%{transform:scaleY(.6)}40%,60%{transform:scaleY(.18)}}
@keyframes ${p}-yawn{0%,30%,80%,100%{transform:scale(.4,.25)}45%,65%{transform:scale(1.1,1.2)}}
@keyframes ${p}-rumble{0%,55%,100%{transform:none}60%{transform:rotate(-4deg)}66%{transform:rotate(4deg)}72%{transform:rotate(-3deg)}78%{transform:rotate(3deg)}84%{transform:rotate(-1deg)}}
@keyframes ${p}-pulse{0%,100%{opacity:.25}50%{opacity:1}}
@keyframes ${p}-wob{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(7deg)}}
@keyframes ${p}-blink{0%,17%,21%,58%,62%,66%,70%,100%{transform:none}19%,60%,68%{transform:scaleY(.08)}}
@keyframes ${p}-wave{0%,100%{transform:rotate(-150deg)}25%,75%{transform:rotate(-118deg)}50%{transform:rotate(-158deg)}}
@keyframes ${p}-up{0%,100%{transform:none}50%{transform:rotate(${'-140deg'})}}
@keyframes ${p}-cheer{from{transform:rotate(150deg)}to{transform:rotate(168deg)}}
@keyframes ${p}-tap{50%{transform:translateY(4px)}}
@keyframes ${p}-type{0%{opacity:1}50%{opacity:.25}}
@keyframes ${p}-flap{0%,100%{transform:skewX(-3deg)}50%{transform:skewX(4deg) scaleX(1.04)}}
@keyframes ${p}-twinkle{0%,100%{transform:scale(.3) rotate(0);opacity:.2}50%{transform:scale(1) rotate(90deg);opacity:1}}
@keyframes ${p}-zz{0%{opacity:0;transform:translate(0,8px)}25%{opacity:1}100%{opacity:0;transform:translate(10px,-22px)}}
@keyframes ${p}-fall{0%{opacity:0;transform:translateY(0) rotate(0)}10%{opacity:1}90%{opacity:1}100%{opacity:0;transform:translateY(190px) rotate(300deg)}}
@keyframes ${p}-rise{0%{opacity:0;transform:translateY(14px) scale(.6)}20%{opacity:1}100%{opacity:0;transform:translateY(-34px) scale(1.1)}}
@keyframes ${p}-ball{0%,100%{transform:translateY(0)}50%{transform:translateY(-54px)}}`;
  // Left arm cheer needs the mirrored angle.
  const cssFixed = css.replace(`.${p}-armL,.${p}-armR{animation:${p}-cheer`, `.${p}-armL{animation:${p}-cheerL .7s ${EASE.io} infinite alternate}.${p}-armR{animation:${p}-cheer`)
    + `@keyframes ${p}-cheerL{from{transform:rotate(-150deg)}to{transform:rotate(-168deg)}}`;

  const svg = `<g transform="translate(${x},${y}) scale(${scale})"><ellipse cx="0" cy="3" rx="46" ry="7" fill="${ink}" opacity=".13"/><g>${bits}</g>
<g class="${p}-root">${cape}${feet}${arm('L')}${arm('R')}${antenna}${body}${topHat}${partyHat}${screen}<g class="${p}-eyes">${eye(-17, 0)}${eye(17, 1)}</g>${shades}${mouth}${blush}${bow}${laptop}${zz}${sparkles}${rumble}</g>${fxSvg}</g>`;
  return { css: cssFixed, svg };
}
