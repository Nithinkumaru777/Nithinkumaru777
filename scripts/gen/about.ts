import { config } from '../config.ts';
import { doc, esc, measure } from '../lib/svg.ts';
import type { Theme } from '../lib/theme.ts';

/** A terminal window that types out a short JSON intro, holds it, then starts again. */
export function about(t: Theme) {
  const W = 1200, H = 446, size = 21, lh = 33, x0 = 92, y0 = 122, cw = measure('0', size, 'm');
  const term = t.mode === 'light' ? { bg: '#2B2017', bar: '#3A2D22', text: '#FFF2DF', dim: '#B9A48E' } : { bg: '#120E0B', bar: '#1F1813', text: '#F8EDDD', dim: '#9C8A77' };
  const kv: [string, string][] = [['name', config.name], ['based_in', config.location], ['role', 'College student, freelance developer'], ['building', config.about.building], ['learning', config.about.learning], ['ask_me_about', config.about.askMeAbout]];
  type Seg = [string, string];
  const lines: Seg[][] = [[['$ ', term.dim], ['cat about.json', term.text]], [['{', term.dim]],
    ...kv.map(([k, v], i): Seg[] => [['  "' + k + '"', t.accent], [': ', term.dim], ['"' + v + '"', term.text], [i < kv.length - 1 ? ',' : '', term.dim]]), [['}', term.dim]]];
  const chars = lines.map((l) => l.reduce((n, s) => n + s[0].length, 0));
  const total = chars.reduce((a, b) => a + b, 0), cycle = 18, typeShare = 62;   // percent of the cycle spent typing
  let done = 0, css = '', body = '';
  lines.forEach((l, i) => {
    const a = (done / total) * typeShare, b = ((done + chars[i]) / total) * typeShare, wpx = chars[i] * cw; done += chars[i];
    const y = y0 + i * lh;
    body += `<text x="${x0}" y="${y}" font-size="${size}" class="m" xml:space="preserve">${l.map(([s, c]) => `<tspan style="fill:${c}">${esc(s)}</tspan>`).join('')}</text>`
      + `<rect class="cv cv${i}" x="${x0 - 2}" y="${y - 23}" width="${(wpx + 6).toFixed(1)}" height="${lh}" fill="${term.bg}"/>`
      + `<rect class="cr cr${i}" x="${x0}" y="${y - 20}" width="11" height="25" rx="2" fill="${t.accent}"/>`;
    // The cover shrinks one character per step; the cursor rides the edge and shows only while its line is typed.
    css += `.cv${i}{transform-origin:${(x0 + wpx + 4).toFixed(1)}px 0;animation:cv${i} ${cycle}s infinite}@keyframes cv${i}{0%,${a.toFixed(2)}%{transform:scaleX(1);animation-timing-function:steps(${chars[i]},end)}${b.toFixed(2)}%,97%{transform:scaleX(0)}100%{transform:scaleX(1)}}`
      + `.cr${i}{opacity:0;animation:cr${i} ${cycle}s infinite}@keyframes cr${i}{0%,${a.toFixed(2)}%{opacity:0;transform:none}${(a + 0.01).toFixed(2)}%{opacity:1;transform:none;animation-timing-function:steps(${chars[i]},end)}${b.toFixed(2)}%{opacity:1;transform:translateX(${wpx.toFixed(1)}px)}${(b + 0.01).toFixed(2)}%,100%{opacity:0;transform:translateX(${wpx.toFixed(1)}px)}}`;
  });
  const endX = x0 + cw, endY = y0 + (lines.length - 1) * lh;
  css += `.end{opacity:0;animation:end ${cycle}s steps(1) infinite}@keyframes end{0%,${typeShare}%{opacity:0}${typeShare + 0.1}%,68%,74%,80%,86%,92%{opacity:1}65%,71%,77%,83%,89%,96%,100%{opacity:0}}`;
  const frame = `<rect x="40" y="34" width="${W - 80}" height="${H - 68}" rx="18" fill="${term.bg}" stroke="${t.ink}" stroke-width="3"/><path d="M40,82 v-30 a18,18 0 0 1 18,-18 h${W - 116} a18,18 0 0 1 18,18 v30Z" fill="${term.bar}"/>
<circle cx="72" cy="58" r="7" fill="${t.accent}"/><circle cx="96" cy="58" r="7" fill="${t.shade}"/><circle cx="120" cy="58" r="7" fill="${term.dim}"/><text x="${W / 2}" y="64" text-anchor="middle" font-size="16" class="m" style="fill:${term.dim}">nithin@bengaluru: ~/about</text>`;
  return doc({ w: W, h: H, t, title: `About ${config.name}: based in ${config.location}. Building ${config.about.building}. Learning ${config.about.learning}. Ask me about ${config.about.askMeAbout}.`, css, fonts: ['m'],
    body: `${frame}${body}<rect class="end" x="${endX}" y="${endY - 20}" width="11" height="25" rx="2" fill="${t.accent}"/>` });
}
