import { config } from '../config.ts';
import { doc, EASE, esc, heading, measure } from '../lib/svg.ts';
import type { Theme } from '../lib/theme.ts';
import type { Stats } from '../lib/github.ts';

const W = 590, H = 250;
const waiting = (t: Theme) => `<text x="${W - 28}" y="40" text-anchor="end" font-size="13" class="m s">fills in on the next run</text>`;

/** A number whose digits roll up into place like an odometer. */
function roll(t: Theme, value: number, x: number, y: number, size: number, id: string, delay = 0) {
  const s = String(value), dw = measure('0', size, 'b'), h = size * 1.12;
  let svg = `<clipPath id="${id}"><rect x="${x}" y="${y - size * 0.86}" width="${dw * s.length + 4}" height="${h}"/></clipPath><g clip-path="url(#${id})">`, css = '';
  [...s].forEach((ch, i) => {
    const d = Number(ch);
    svg += `<g class="${id}-${i}">${Array.from({ length: d + 1 }, (_, k) => `<text x="${(x + i * dw + dw / 2).toFixed(1)}" y="${(y + k * h).toFixed(1)}" text-anchor="middle" font-size="${size}" class="b">${k}</text>`).join('')}</g>`;
    css += `.${id}-${i}{animation:${id}-${i} ${(1.1 + i * 0.18).toFixed(2)}s ${EASE.expo} ${delay + i * 0.08}s both}@keyframes ${id}-${i}{from{transform:none}to{transform:translateY(${(-d * h).toFixed(1)}px)}}`;
  });
  // `both` + final transform keeps the last digit showing; with reduced motion the fallback rule below shows it too.
  css += [...s].map((ch, i) => `@media (prefers-reduced-motion: reduce){.${id}-${i}{transform:translateY(${(-Number(ch) * h).toFixed(1)}px)}}`).join('');
  return { svg: svg + '</g>', css, width: dw * s.length };
}

export function statsCard(t: Theme, s: Stats) {
  const items: [string, number][] = [['Stars', s.stars], ['Commits this year', s.commitsYear], ['Pull requests', s.prs], ['Issues', s.issues], ['Repos', s.repos], ['Followers', s.followers]];
  let body = heading(t, 'GitHub stats') + (s.live ? '' : waiting(t)), css = '';
  items.forEach(([label, v], i) => {
    const x = 28 + (i % 3) * 182, y = 112 + Math.floor(i / 3) * 84, r = roll(t, v, x, y, 38, `r${i}`, 0.1 + i * 0.1);
    body += r.svg + `<text x="${x}" y="${y + 24}" font-size="14" class="s">${label}</text>`; css += r.css;
  });
  return doc({ w: W, h: H, t, title: `GitHub stats for ${config.name}: ${items.map(([l, v]) => `${v} ${l.toLowerCase()}`).join(', ')}.`, body, css });
}

export function languages(t: Theme, s: Stats) {
  const langs = s.languages.length ? s.languages : [{ name: 'TypeScript', share: 0.4 }, { name: 'Python', share: 0.3 }, { name: 'HTML', share: 0.18 }, { name: 'CSS', share: 0.12 }];
  const sum = langs.reduce((a, l) => a + l.share, 0) || 1, R = 68, C = 2 * Math.PI * R, cx = 124, cy = 146;
  // One hue, stepped from the accent to the neutrals, so the ring stays inside the palette.
  const fills = [t.accent, t.ink, t.shade, t.sub, t.line];
  let off = 0, body = heading(t, 'Languages') + (s.live ? '' : waiting(t)), css = '';
  langs.forEach((l, i) => {
    const len = (l.share / sum) * C, gap = langs.length > 1 ? 4 : 0;
    body += `<circle class="seg seg${i}" cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${fills[i % 5]}" stroke-width="26" stroke-dasharray="${Math.max(1, len - gap).toFixed(1)} ${C.toFixed(1)}" stroke-dashoffset="${(-off).toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"/>`;
    css += `.seg${i}{animation:seg${i} 1.2s ${EASE.expo} ${(0.15 + i * 0.14).toFixed(2)}s both}@keyframes seg${i}{from{stroke-dasharray:0 ${C.toFixed(1)}}}`;
    const y = 96 + i * 30;
    body += `<g class="row" style="animation-delay:${(0.3 + i * 0.12).toFixed(2)}s"><rect x="250" y="${y - 13}" width="16" height="16" rx="5" fill="${fills[i % 5]}" stroke="${t.ink}" stroke-width="2"/><text x="278" y="${y}" font-size="17" class="b">${esc(l.name)}</text><text x="${W - 28}" y="${y}" text-anchor="end" font-size="15" class="m s">${s.languages.length ? ((l.share / sum) * 100).toFixed(1) + '%' : 'soon'}</text></g>`;
    off += len;
  });
  body += `<g class="spin"><circle cx="${cx}" cy="${cy}" r="${R + 21}" fill="none" stroke="${t.line}" stroke-width="2.5" stroke-dasharray="3 10" stroke-linecap="round"/></g><text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="26" class="b">${langs.length}</text><text x="${cx}" y="${cy + 18}" text-anchor="middle" font-size="13" class="s">languages</text>`;
  css += `.row{animation:row .7s ${EASE.expo} both}@keyframes row{from{transform:translateX(18px);opacity:0}}.spin{transform-origin:${cx}px ${cy}px;animation:spin 40s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`;
  return doc({ w: W, h: H, t, title: `Most used languages: ${langs.map((l) => `${l.name} ${((l.share / sum) * 100).toFixed(0)}%`).join(', ')}.`, body, css, fonts: ['r', 'b', 'm'] });
}

export function streak(t: Theme, s: Stats) {
  const r = roll(t, s.streak.current, 0, 0, 76, 'st', 0.2), alive = s.streak.alive;
  const flame = `<g transform="translate(120,196)"><g class="fl1"><path d="M0,0 C-44,0 -52,-44 -30,-74 C-28,-56 -18,-52 -14,-60 C-8,-84 -12,-104 6,-124 C8,-96 40,-84 40,-40 C40,-14 22,0 0,0Z" fill="${alive ? t.accent : t.line}" stroke="${t.ink}" stroke-width="3.5" stroke-linejoin="round"/></g>
<g class="fl2"><path d="M2,-6 C-20,-6 -24,-30 -10,-46 C-8,-36 0,-36 2,-46 C4,-56 4,-62 10,-70 C12,-52 26,-44 24,-26 C23,-14 14,-6 2,-6Z" fill="${alive ? t.shell : t.card}" stroke="${t.ink}" stroke-width="3" stroke-linejoin="round"/></g>
${alive ? [0, 1, 2].map((i) => `<circle class="sp sp${i}" cx="${-30 + i * 30}" cy="-110" r="4" fill="${t.accent}"/>`).join('') : ''}<ellipse cx="0" cy="6" rx="46" ry="7" fill="${t.ink}" opacity=".12"/></g>`;
  const css = `${r.css}.fl1{transform-origin:120px 196px;animation:f1 1.5s ${EASE.io} infinite alternate}.fl2{transform-origin:120px 196px;animation:f2 1.1s ${EASE.io} infinite alternate}
@keyframes f1{from{transform:scale(1,.96) skewX(-3deg)}to{transform:scale(.97,1.05) skewX(3deg)}}@keyframes f2{from{transform:scale(.94,1.06) skewX(4deg)}to{transform:scale(1.05,.94) skewX(-4deg)}}
.sp{animation:sp 2.2s ${EASE.out} infinite}.sp1{animation-delay:.7s}.sp2{animation-delay:1.4s}@keyframes sp{0%{opacity:0;transform:translateY(20px)}30%{opacity:1}100%{opacity:0;transform:translateY(-40px)}}
${alive ? '' : '.fl1,.fl2{animation-duration:4s}'}`;
  const body = heading(t, 'Streak') + (s.live ? '' : waiting(t)) + flame
    + `<g transform="translate(248,150)">${r.svg}<text x="${r.width + 12}" y="0" font-size="24" class="b">${s.streak.current === 1 ? 'day' : 'days'}</text></g>
<text x="248" y="186" font-size="16" class="s">${alive ? 'current streak, still burning' : 'no streak right now, the next commit lights it'}</text><text x="248" y="214" font-size="15" class="m s">longest: ${s.streak.longest} ${s.streak.longest === 1 ? 'day' : 'days'}</text>`;
  return doc({ w: W, h: H, t, title: `Contribution streak: ${s.streak.current} days. Longest: ${s.streak.longest} days.`, body, css, fonts: ['r', 'b', 'm'] });
}

export function week(t: Theme, s: Stats, now: Date) {
  const days = s.week.length === 7 ? s.week : Array.from({ length: 7 }, (_, i) => ({ day: new Date(now.getTime() - (6 - i) * 86400_000).toISOString().slice(0, 10), count: 0 }));
  const max = Math.max(1, ...days.map((d) => d.count)), total = days.reduce((a, d) => a + d.count, 0), base = 196, top = 86, bw = 52, gap = 24, x0 = 34;
  let body = heading(t, 'This week') + (s.live ? `<text x="${W - 28}" y="40" text-anchor="end" font-size="14" class="m s">${total} contributions</text>` : waiting(t));
  body += `<path d="M28,${base + 1.5} h${W - 56}" stroke="${t.line}" stroke-width="3" stroke-linecap="round"/>`;
  days.forEach((d, i) => {
    const h = Math.max(8, ((d.count / max) * (base - top))), x = x0 + i * (bw + gap), best = d.count === max && d.count > 0;
    const name = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(d.day + 'T00:00:00Z').getUTCDay()];
    body += `<rect class="wb" style="animation-delay:${(0.15 + i * 0.09).toFixed(2)}s" x="${x}" y="${(base - h).toFixed(1)}" width="${bw}" height="${h.toFixed(1)}" rx="12" fill="${best ? t.accent : t.shade}" stroke="${t.ink}" stroke-width="3"/>
<text class="wn" style="animation-delay:${(0.7 + i * 0.09).toFixed(2)}s" x="${x + bw / 2}" y="${(base - h - 9).toFixed(1)}" text-anchor="middle" font-size="15" class="b">${d.count}</text><text x="${x + bw / 2}" y="${base + 26}" text-anchor="middle" font-size="14" class="s">${name}</text>`;
  });
  body = body.replace(/class="wn" (style="[^"]*") ([^>]*) class="b"/g, 'class="wn b" $1 $2');
  const css = `.wb{transform-box:fill-box;transform-origin:bottom;animation:wb 1s ${EASE.spring} both}@keyframes wb{from{transform:scaleY(0)}}.wn{animation:wn .5s ${EASE.out} both}@keyframes wn{from{opacity:0;transform:translateY(8px)}}`;
  return doc({ w: W, h: H, t, title: `Contributions in the last seven days: ${days.map((d) => d.count).join(', ')}.`, body, css, fonts: ['r', 'b', 'm'] });
}
