import { existsSync, readFileSync } from 'node:fs';
import { byte, stageFor } from '../lib/byte.ts';
import { doc, EASE, heading } from '../lib/svg.ts';
import type { Theme } from '../lib/theme.ts';
import type { Stats } from '../lib/github.ts';
import type { World } from '../lib/state.ts';

const W = 1200, COLS = 53, ROWS = 7, CELL = 16, STEP = 20, GX = 70, GY = 76;
const level = (n: number, max: number) => (n === 0 ? 0 : Math.min(4, 1 + Math.floor((n / Math.max(1, max)) * 3.999)));

/**
 * The contribution grid with a snake eating its way through it and Byte running after the snake.
 * If snake.yml has produced assets/snk-<mode>.svg (Platane/snk), that picture is embedded and Byte chases underneath it.
 * Otherwise the grid and the snake are drawn here from the cached contribution calendar.
 */
export function snake(t: Theme, s: Stats, w: World) {
  const snk = `assets/snk-${t.mode}.svg`;
  const H = 316, trackY = 288;
  const runner = byte({ t, mood: 'happy', stage: stageFor(w.byte.level), wearing: w.byte.accessories.wearing, x: 0, y: 0, scale: existsSync(`assets/snk-${t.mode}.svg`) ? 0.44 : 0.34, id: 'ch' });
  if (existsSync(snk)) {
    const data = Buffer.from(readFileSync(snk)).toString('base64');
    const css = `${runner.css}.run{animation:run 14s ${EASE.io} infinite alternate}@keyframes run{from{transform:translateX(70px)}to{transform:translateX(${W - 70}px)}}`;
    return doc({ w: W, h: H, t, title: 'Contribution snake, with Byte chasing it.', css, body: `${heading(t, 'Byte chases the contribution snake')}<image x="40" y="60" width="${W - 80}" height="150" preserveAspectRatio="xMidYMid meet" href="data:image/svg+xml;base64,${data}"/><path d="M40,${trackY + 2} h${W - 80}" stroke="${t.line}" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 12"/><g class="run"><g transform="translate(0,${trackY})">${runner.svg}</g></g>` });
  }
  const cal = s.calendar.length ? s.calendar.slice(-COLS * ROWS) : [];
  const max = Math.max(1, ...cal), pad = COLS * ROWS - cal.length;
  const shades = [t.line, t.soft, t.shade, t.accent, t.ink], cycle = 46;
  // The snake sweeps the columns top to bottom, then bottom to top. A cell "disappears" when the head reaches it.
  const order = (c: number, r: number) => c * ROWS + (c % 2 === 0 ? r : ROWS - 1 - r), N = COLS * ROWS, travel = 80;   // percent of the cycle spent moving
  let cells = '';
  for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) {
    const i = c * ROWS + r - pad, n = i >= 0 ? cal[i] : 0, lv = level(n, max);
    cells += `<rect x="${GX + c * STEP}" y="${GY + r * STEP}" width="${CELL}" height="${CELL}" rx="4.500" fill="${shades[0]}"/>`;
    if (lv > 0) cells += `<rect class="eat" style="animation-delay:${((order(c, r) / N) * travel / 100 * cycle).toFixed(2)}s" x="${GX + c * STEP}" y="${GY + r * STEP}" width="${CELL}" height="${CELL}" rx="4.500" fill="${shades[lv]}"/>`;
  }
  const stops: string[] = [];
  for (let c = 0; c < COLS; c++) {
    const a = ((c * ROWS) / N) * travel, b = ((c * ROWS + ROWS - 1) / N) * travel, x = c * STEP, y0 = c % 2 === 0 ? 0 : (ROWS - 1) * STEP, y1 = c % 2 === 0 ? (ROWS - 1) * STEP : 0;
    stops.push(`${a.toFixed(3)}%{transform:translate(${x}px,${y0}px)}${b.toFixed(3)}%{transform:translate(${x}px,${y1}px)}`);
  }
  const path = `@keyframes path{${stops.join('')}${travel + 0.5}%,100%{transform:translate(${COLS * STEP + 80}px,0)}}`;
  const seg = (i: number) => `<g class="sn" style="animation-delay:${(i * 0.085).toFixed(3)}s"><rect x="${GX - 1}" y="${GY - 1}" width="${CELL + 2}" height="${CELL + 2}" rx="${i === 0 ? 7 : 5.5}" fill="${i === 0 ? t.accent : t.ink}" opacity="${i === 0 ? 1 : (1 - i * 0.12).toFixed(2)}" stroke="${t.card}" stroke-width="1.5"/>${i === 0 ? `<circle cx="${GX + 5}" cy="${GY + 6}" r="1.800" fill="${t.onAccent}"/><circle cx="${GX + 11}" cy="${GY + 6}" r="1.800" fill="${t.onAccent}"/>` : ''}</g>`;
  const body = `${heading(t, 'Byte chases the contribution snake')}${s.live ? '' : `<text x="${W - 28}" y="40" text-anchor="end" font-size="13" class="m s">real contributions fill in on the next run</text>`}${cells}
${[5, 4, 3, 2, 1, 0].map(seg).join('')}<g class="sn" style="animation-delay:1.25s"><g transform="translate(${GX + 8},${GY + 15})">${runner.svg}</g></g>
<text x="${GX}" y="${GY + ROWS * STEP + 22}" font-size="13" class="m s">one year of contributions, oldest on the left</text>`;
  // A square vanishes when the head reaches it and grows back a while later, so the board refills behind the snake.
  const css = `${runner.css}.sn{animation:path ${cycle}s linear infinite both}${path}
.eat{transform-box:fill-box;transform-origin:center;animation:eat ${cycle}s ${EASE.out} infinite}@keyframes eat{0%,30%{opacity:0;transform:scale(.2)}36%,100%{opacity:1;transform:none}}`;
  return doc({ w: W, h: GY + ROWS * STEP + 44, t, title: 'A year of contributions as a grid. A snake eats the squares and Byte runs after it.', css, body, fonts: ['b', 'm'] });
}
