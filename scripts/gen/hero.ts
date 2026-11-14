import { config } from '../config.ts';
import { byte, stageFor } from '../lib/byte.ts';
import { doc, EASE, esc, measure } from '../lib/svg.ts';
import type { Theme } from '../lib/theme.ts';
import type { World } from '../lib/state.ts';

/** Bengaluru-flavoured skyline: Vidhana Soudha dome, UB City towers, a metro viaduct. Abstract on purpose. */
const skyline = (t: Theme) => `
<g class="sky2" fill="${t.line}"><path d="M620 300v-70h26v-22h18v22h30v-48h22v48h34v-30h40v30h30v-58h16v-18h14v18h16v58h44v-36h36v36h40v-52h28v52h36v-24h50v24h40v70z"/></g>
<g class="sky1" fill="${t.shade}" opacity="${t.mode === 'light' ? 0.75 : 0.28}"><path d="M560 300v-44h60v-16h14a26 26 0 0 1 52 0h14v16h60v44z"/><rect x="655" y="196" width="10" height="22" rx="3"/><path d="M800 300v-96l18-14 18 14v96zM850 300v-124l16-12 16 12v124zM930 300v-58h60v58zM1010 300v-82h34v82zM1070 300v-40h70v40z"/><path d="M540 300v-10h640v10zM600 290v-14h8v14zM760 290v-14h8v14zM920 290v-14h8v14zM1080 290v-14h8v14z"/><rect x="540" y="270" width="640" height="7" rx="3"/></g>`;

export function hero(t: Theme, w: World, clock: string) {
  const W = 1200, H = 360, name = config.name, size = 76, x0 = 64, y0 = 150;
  // The name is revealed by a cover that jumps one letter at a time; the caret rides its left edge.
  const widths = [...name].map((_, i) => measure(name.slice(0, i + 1), size));
  const total = widths[widths.length - 1], cycle = 14, typeEnd = 22;
  const stops = widths.map((wd, i) => `${(((i + 1) / widths.length) * typeEnd).toFixed(2)}%{transform:translateX(${wd.toFixed(1)}px)}`).join('');
  const roles = config.roles.map((r, i) => `<text class="role role${i}" x="${x0}" y="212" font-size="34"><tspan class="s">I build </tspan><tspan class="b a">${esc(r.replace(/^I build /, ''))}</tspan></text>`).join('');
  const b = byte({ t, mood: w.byte.mood === 'sleeping' ? 'sleeping' : 'happy', stage: stageFor(w.byte.level), wearing: w.byte.accessories.wearing, wave: w.byte.mood !== 'sleeping', x: 1010, y: 296, scale: 1.45 });
  const css = `${b.css}
.cover{animation:type ${cycle}s steps(1,end) infinite}.caret{animation:type ${cycle}s steps(1,end) infinite}.caret rect{animation:blink .9s steps(1) infinite}
@keyframes type{0%{transform:none}${stops}96%{transform:translateX(${total.toFixed(1)}px)}100%{transform:none}}
@keyframes blink{50%{opacity:0}}
.role{opacity:0;animation:role 12s ${EASE.io} infinite}.role1{animation-delay:3s}.role2{animation-delay:6s}.role3{animation-delay:9s}
@keyframes role{0%{opacity:0;transform:translateY(16px)}4%,21%{opacity:1;transform:none}25%,100%{opacity:0;transform:translateY(-16px)}}
.sky1{animation:drift 16s ${EASE.io} infinite alternate}.sky2{animation:drift2 16s ${EASE.io} infinite alternate}
@keyframes drift{from{transform:translateX(-10px)}to{transform:translateX(14px)}}@keyframes drift2{from{transform:translateX(8px)}to{transform:translateX(-10px)}}
.sun{animation:sun 8s ${EASE.io} infinite alternate}@keyframes sun{from{transform:translateY(6px)}to{transform:translateY(-6px)}}`;
  const body = `<clipPath id="in"><rect x="3" y="3" width="${W - 6}" height="${H - 6}" rx="20"/></clipPath><g clip-path="url(#in)">
<circle class="sun" cx="880" cy="150" r="54" fill="${t.accent}" opacity="${t.mode === 'light' ? 0.9 : 0.8}"/>${skyline(t)}<rect x="3" y="299" width="${W - 6}" height="60" fill="${t.card}"/><rect x="40" y="298" width="${W - 80}" height="3" rx="1.5" fill="${t.line}"/></g>
<text x="${x0}" y="78" font-size="19" class="s">Hello, I am</text>
<text x="${x0}" y="${y0}" font-size="${size}" class="b" letter-spacing="-1">${esc(name)}</text>
<rect class="cover" x="${x0}" y="${y0 - 66}" width="${total + 14}" height="88" fill="${t.card}"/>
<g class="caret"><rect x="${x0 + 4}" y="${y0 - 58}" width="5" height="66" rx="2.5" fill="${t.accent}"/></g>
${roles}
<text x="${x0}" y="262" font-size="18" class="s">${esc(config.location)}</text>
<text x="${x0}" y="334" font-size="15" class="m s">Last updated ${clock} IST</text>
${b.svg}`;
  return doc({ w: W, h: H, t, title: `${name}. ${config.roles[0]}, dashboards, AI tools and apps for real businesses. ${config.buddy} the robot waves hello.`, body, css, fonts: ['r', 'b', 'm'] });
}

export function footer(t: Theme, w: World) {
  const W = 1200, H = 220;
  const b = byte({ t, mood: 'idle', stage: stageFor(w.byte.level), wearing: w.byte.accessories.wearing, wave: true, x: 150, y: 184, scale: 1.15 });
  const css = `${b.css}.ring{transform-box:fill-box;transform-origin:center;animation:ring 2.2s ${EASE.out} infinite}@keyframes ring{0%{transform:scale(1);opacity:.8}70%,100%{transform:scale(3.4);opacity:0}}
.bye{animation:bye 5s ${EASE.io} infinite}@keyframes bye{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}`;
  const body = `${b.svg}
<g class="bye"><text x="270" y="92" font-size="40" class="b">Thanks for stopping by.</text></g>
<text x="270" y="128" font-size="19" class="s">${esc(config.buddy)} lives on the full site too, where you can pick it up and throw it.</text>
<g transform="translate(270,154)"><rect width="270" height="40" rx="20" fill="${t.accent}"/><circle class="ring" cx="26" cy="20" r="6" fill="${t.onAccent}"/><circle cx="26" cy="20" r="6" fill="${t.onAccent}"/><text x="46" y="26.500" font-size="17" class="b" style="fill:${t.onAccent}">Open to freelance work</text></g>
<text x="566" y="180" font-size="16" class="m s">${esc(config.site.replace('https://', '').replace(/\/$/, ''))}</text>`;
  return doc({ w: W, h: H, t, title: `${config.buddy} waves goodbye. ${config.name} is open to freelance work.`, body, css, fonts: ['r', 'b', 'm'] });
}
