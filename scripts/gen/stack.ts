import { config } from '../config.ts';
import { doc, EASE, esc, heading, measure } from '../lib/svg.ts';
import type { Theme } from '../lib/theme.ts';

/** Tiny hand-drawn glyphs, one per group, so the grid reads at a glance without borrowing anyone's logo. */
const GLYPH: Record<string, string> = {
  Frontend: 'M-9,-7 h18 v12 h-18Z M-9,-2 h18 M-4,9 h8', Backend: 'M-8,-8 h16 v6 h-16Z M-8,2 h16 v6 h-16Z M-4,-5 h.1 M-4,5 h.1',
  AI: 'M0,-10 l2.6,7.400 l7.400,2.600 l-7.400,2.600 l-2.600,7.400 l-2.600,-7.400 l-7.400,-2.600 l7.400,-2.600Z', Tools: 'M-8,8 l9,-9 M3,-3 a5,5 0 1 0 -1,-6 l4,3 l-3,4Z',
};
export function stack(t: Theme) {
  const W = 1200, groups = Object.entries(config.stack) as [string, readonly string[]][];
  const colW = (W - 56 - 3 * 20) / 4, pad = 18, chipH = 40, gap = 10;
  let css = '', body = heading(t, 'Tech stack'), n = 0, maxH = 0;
  const cols = groups.map(([name, items], g) => {
    let x = pad, y = 62, out = '';
    for (const item of items) {
      const w = Math.ceil(measure(item, 17, 'b')) + 30;
      if (x + w > colW - pad) { x = pad; y += chipH + gap; }
      const d = (0.15 + n * 0.06).toFixed(2), f = (n * 0.37 % 3).toFixed(2);
      out += `<g transform="translate(${x},${y})"><g class="fl" style="animation-delay:-${f}s"><g class="pop" style="animation-delay:${d}s"><rect width="${w}" height="${chipH}" rx="${chipH / 2}" fill="${n % 5 === 0 ? t.soft : t.bg}" stroke="${t.ink}" stroke-width="2.5"/><text x="${w / 2}" y="26" text-anchor="middle" font-size="17" class="b">${esc(item)}</text></g></g></g>`;
      x += w + gap; n++;
    }
    maxH = Math.max(maxH, y + chipH + pad);
    return { name, out, g };
  });
  cols.forEach(({ name, out, g }) => {
    const x = 28 + g * (colW + 20);
    body += `<g transform="translate(${x},64)"><rect width="${colW}" height="${maxH}" rx="18" fill="${t.card}" stroke="${t.line}" stroke-width="2.5"/>
<circle cx="36" cy="32" r="17" fill="${t.accent}"/><g transform="translate(36,32)"><path class="gl" style="animation-delay:${g * 0.6}s" d="${GLYPH[name] ?? GLYPH.Tools}" fill="none" stroke="${t.onAccent}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></g>
<text x="62" y="39" font-size="21" class="b">${esc(name)}</text>${out}</g>`;
  });
  css += `.pop{transform-box:fill-box;transform-origin:center;animation:pop .7s ${EASE.spring} both}@keyframes pop{from{transform:scale(0) rotate(-12deg);opacity:0}}
.fl{animation:fl 3s ${EASE.io} infinite alternate}@keyframes fl{from{transform:translateY(-2.5px)}to{transform:translateY(2.5px)}}
.gl{transform-box:fill-box;transform-origin:center;animation:gl 4.8s ${EASE.spring} infinite}@keyframes gl{0%,80%,100%{transform:none}88%{transform:rotate(-16deg) scale(1.2)}94%{transform:rotate(10deg)}}`;
  return doc({ w: W, h: 64 + maxH + 28, t, title: `Tech stack. ${groups.map(([k, v]) => `${k}: ${v.join(', ')}`).join('. ')}.`, body, css });
}
