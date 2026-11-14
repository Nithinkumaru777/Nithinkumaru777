import { config } from '../config.ts';
import { doc, EASE, esc, measure } from '../lib/svg.ts';
import type { Theme } from '../lib/theme.ts';
import type { Stats } from '../lib/github.ts';

type Project = (typeof config.projects)[number];
/** One small looping illustration per project, drawn inside a 200 × 150 window. */
export function art(t: Theme, kind: Project['art']): { svg: string; css: string } {
  const st = `stroke="${t.ink}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"`;
  switch (kind) {
    case 'gauge': return {
      svg: `<path d="M30,112 a70,70 0 0 1 140,0" fill="none" stroke="${t.line}" stroke-width="16" stroke-linecap="round"/><path class="pg-arc" d="M30,112 a70,70 0 0 1 140,0" fill="none" stroke="${t.accent}" stroke-width="16" stroke-linecap="round" pathLength="100" stroke-dasharray="100"/>
<g class="pg-needle"><path d="M100,112 L100,56" ${st}/></g><circle cx="100" cy="112" r="9" fill="${t.ink}"/><g class="pg-ok"><circle cx="160" cy="34" r="15" fill="${t.accent}" ${st}/><path d="M153,34 l5,5 l9,-10" fill="none" stroke="${t.onAccent}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></g>`,
      css: `.pg-arc{animation:pg-arc 5s ${EASE.io} infinite}@keyframes pg-arc{0%,8%{stroke-dashoffset:100}45%,88%{stroke-dashoffset:22}100%{stroke-dashoffset:100}}
.pg-needle{transform-origin:100px 112px;animation:pg-n 5s ${EASE.io} infinite}@keyframes pg-n{0%,8%{transform:rotate(-90deg)}45%{transform:rotate(56deg)}52%{transform:rotate(46deg)}60%,88%{transform:rotate(50deg)}100%{transform:rotate(-90deg)}}
.pg-ok{transform-box:fill-box;transform-origin:center;animation:pg-ok 5s ${EASE.spring} infinite}@keyframes pg-ok{0%,50%{transform:scale(0)}60%,88%{transform:scale(1)}96%,100%{transform:scale(0)}}` };
    case 'list': return {
      svg: [0, 1, 2].map((i) => `<g transform="translate(22,${22 + i * 40})"><rect width="156" height="30" rx="10" fill="${t.bg}" ${st}/><rect x="9" y="8" width="14" height="14" rx="4" fill="${t.card}" stroke="${t.ink}" stroke-width="2.4"/><rect class="pl-box pl${i}" x="9" y="8" width="14" height="14" rx="4" fill="${t.accent}" stroke="${t.ink}" stroke-width="2.4"/><path class="pl-tick pl${i}" d="M12,15 l3,3 l6,-7" fill="none" stroke="${t.onAccent}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" pathLength="10" stroke-dasharray="10"/><rect x="32" y="12" width="${[96, 72, 110][i]}" height="6" rx="3" fill="${t.sub}" opacity=".55"/><rect class="pl-strike pl${i}" x="30" y="14" width="${[100, 76, 114][i]}" height="2.6" rx="1.3" fill="${t.ink}"/></g>`).join(''),
      css: `.pl-box{opacity:0;animation:pl-box 6s steps(1) infinite}.pl-tick{stroke-dashoffset:10;animation:pl-tick 6s ${EASE.out} infinite}.pl-strike{transform-box:fill-box;transform-origin:left;transform:scaleX(0);animation:pl-st 6s ${EASE.out} infinite}
.pl1{animation-delay:1.1s}.pl2{animation-delay:2.2s}@keyframes pl-box{0%,9%{opacity:0}10%,62%{opacity:1}63%,100%{opacity:0}}@keyframes pl-tick{0%,10%{stroke-dashoffset:10}16%,62%{stroke-dashoffset:0}63%,100%{stroke-dashoffset:10}}@keyframes pl-st{0%,14%{transform:scaleX(0)}22%,62%{transform:scaleX(1)}63%,100%{transform:scaleX(0)}}` };
    case 'bars': return {
      svg: `<text x="24" y="38" font-size="15" class="m s">FPS</text><text class="pb-n b" x="176" y="38" text-anchor="end" font-size="22">144</text>` + [0, 1, 2, 3, 4, 5, 6].map((i) => `<rect class="pb pb${i}" x="${24 + i * 23}" y="52" width="15" height="78" rx="5" fill="${i > 3 ? t.accent : t.shade}" stroke="${t.ink}" stroke-width="2.4"/>`).join('') + `<path d="M18,132 h166" ${st}/>`,
      css: `.pb{transform-box:fill-box;transform-origin:bottom;animation:pb 4.4s ${EASE.spring} infinite}${[0.35, 0.3, 0.42, 0.38, 0.7, 0.85, 1].map((v, i) => `.pb${i}{--a:${(v * 0.55).toFixed(2)};--b:${v};animation-delay:${i * 0.07}s}`).join('')}
@keyframes pb{0%,12%{transform:scaleY(var(--a))}40%,86%{transform:scaleY(var(--b))}100%{transform:scaleY(var(--a))}}.pb-n{font-weight:600;animation:pb-n 4.4s ${EASE.io} infinite}@keyframes pb-n{0%,14%{opacity:.25}40%,86%{opacity:1}100%{opacity:.25}}` };
    default: return {
      svg: [0, 1, 2, 3, 4, 5, 6, 7].flatMap((c) => [0, 1, 2, 3].map((r) => `<rect class="pp" x="${22 + c * 20}" y="${20 + r * 20}" width="15" height="15" rx="4" fill="${t.accent}" style="animation-delay:${(((c * 5 + r * 3) % 11) * 0.33).toFixed(2)}s"/>`)).join('')
        + `<path class="pp-line" d="M18,128 h34 l8,-16 l12,30 l10,-22 l7,8 h95" fill="none" ${st} pathLength="100" stroke-dasharray="100"/>`,
      css: `.pp{animation:pp 3.6s ${EASE.io} infinite}@keyframes pp{0%,100%{opacity:.14}50%{opacity:1}}.pp-line{animation:pp-l 3.6s ${EASE.io} infinite}@keyframes pp-l{0%{stroke-dashoffset:100}55%,85%{stroke-dashoffset:0}100%{stroke-dashoffset:-100}}` };
  }
}

export function project(t: Theme, p: Project, s: Stats, n = 0) {
  const W = 590, H = 250, a = art(t, p.art), info = s.projects[p.repo], blurb = p.blurb;
  let cx = 28; const chips = p.chips.map((c) => { const w = Math.ceil(measure(c, 14, 'b')) + 22; const out = `<g transform="translate(${cx},186)"><rect width="${w}" height="28" rx="14" fill="${t.bg}" stroke="${t.line}" stroke-width="2"/><text x="${w / 2}" y="19" text-anchor="middle" font-size="14" class="b s">${esc(c)}</text></g>`; cx += w + 8; return out; }).join('');
  // Wrap the blurb to two lines at most.
  const words = blurb.split(' '), rows: string[] = ['']; for (const wd of words) { const cur = rows[rows.length - 1]; if (measure((cur + ' ' + wd).trim(), 17, 'r') > 318 && cur) rows.push(wd); else rows[rows.length - 1] = (cur + ' ' + wd).trim(); }
  const stars = info ? String(info.stars) : '0';
  const css = `${a.css}.art{animation:in .8s ${EASE.expo} ${0.1 + n * 0.1}s both}@keyframes in{from{transform:translateX(26px);opacity:0}}
.star{transform-box:fill-box;transform-origin:center;animation:star 4s ${EASE.spring} ${n * 0.4}s infinite}@keyframes star{0%,78%,100%{transform:none}86%{transform:rotate(72deg) scale(1.3)}}
.go{animation:go 2.4s ${EASE.io} infinite}@keyframes go{0%,100%{transform:none}50%{transform:translateX(5px)}}`;
  const body = `<text x="28" y="58" font-size="27" class="b">${esc(p.title)}</text>
${rows.slice(0, 2).map((r, i) => `<text x="28" y="${92 + i * 24}" font-size="17" class="s">${esc(r)}</text>`).join('')}
<g transform="translate(28,146)"><path class="star" d="M10,0 l3.100,6.400 l7,1 l-5.100,4.900 l1.200,7 l-6.200,-3.300 l-6.200,3.300 l1.200,-7 l-5.100,-4.900 l7,-1Z" fill="${t.accent}" stroke="${t.ink}" stroke-width="2" stroke-linejoin="round"/><text x="30" y="16" font-size="17" class="b">${stars}</text>
<g class="go"><text x="${46 + measure(stars, 17)}" y="16" font-size="15" class="m s">${esc(p.repo)}</text></g></g>${chips}
<g class="art" transform="translate(366,50)"><rect x="0" y="0" width="200" height="150" rx="16" fill="${t.mode === 'light' ? t.bg : '#1F1915'}" stroke="${t.line}" stroke-width="2.5"/>${a.svg}</g>`;
  return doc({ w: W, h: H, t, title: `${p.title}: ${blurb}. ${stars} stars.`, body, css, fonts: ['r', 'b', 'm'] });
}
