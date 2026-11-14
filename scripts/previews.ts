/**
 * Renders every README section in Chrome, light and dark, and checks it.
 *   - PNG of each section as the README shows it (inside an <img>, so no script and no external loads)
 *   - an animated GIF of the sections that loop (hero, Byte card, buttons, reactions, snake…)
 *   - "is it animating?": frames at different times must differ (unless the section is meant to rest)
 *   - "is anything clipped?": text and Byte must stay inside the viewBox at every sampled time
 * Usage: npm run previews            (current state)
 *        npm run previews -- --demo  (a busy made-up world, useful for screenshots)
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium, type Page } from '@playwright/test';
import { build, readMeta } from './generate.ts';
import { cached } from './lib/github.ts';
import { load } from './lib/store.ts';
import { demoStats, demoWorld } from './demo.ts';

const demo = process.argv.includes('--demo'), out = resolve(demo ? 'previews/demo' : 'previews/current'), raw = join(out, 'svg'), gifOnly = process.argv.includes('--no-gif') ? false : true;
rmSync(out, { recursive: true, force: true }); mkdirSync(raw, { recursive: true });
const files = demo ? build(demoWorld(), demoStats(), { updatedAt: '2026-11-14T08:00:00Z' }, {}) : build(load(), cached(), readMeta(), existsSync('state/avatars.json') ? JSON.parse((await import('node:fs')).readFileSync('state/avatars.json', 'utf8')) : {});
const names = [...new Set([...files.keys()].filter((k) => k.endsWith('-light.svg')).map((k) => k.slice(7, -10)))];
for (const n of names) for (const m of ['light', 'dark']) writeFileSync(join(raw, `${n}-${m}.svg`), files.get(`assets/${n}-${m}.svg`)!);
writeFileSync(join(out, 'README.md'), files.get('README.md')!);

const GIFS = ['hero', 'byte', 'btn-pet', 'about', 'stack', 'project-saakh', 'stats', 'streak', 'snake', 'friends', 'ttt-status', 'footer', 'react-pet', 'react-dance', 'react-levelup'];
const RESTING = new Set<string>([]);           // sections allowed to be still after their entrance
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ deviceScaleFactor: 1 });
const problems: string[] = [];

/** Open the SVG as its own document so its CSS animations can be paused and stepped exactly. */
async function openSvg(p: Page, file: string) {
  await p.goto('file://' + file); await p.evaluate(() => document.fonts.ready);
  await p.evaluate(() => document.getAnimations().forEach((a) => a.pause()));
}
const seek = (p: Page, ms: number) => p.evaluate((t) => document.getAnimations().forEach((a) => { a.currentTime = t; }), ms);

for (const n of names) for (const m of ['light', 'dark'] as const) {
  const file = join(raw, `${n}-${m}.svg`), svg = files.get(`assets/${n}-${m}.svg`)!;
  const [, w, h] = /viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/.exec(svg)!.map(Number);
  // 1. As the README shows it: an <img> on the GitHub page background.
  await page.setViewportSize({ width: Math.ceil(w) + 32, height: Math.ceil(h) + 32 });
  writeFileSync(join(out, '_img.html'), `<body style="margin:16px;background:${m === 'light' ? '#ffffff' : '#0d1117'}"><img src="svg/${n}-${m}.svg" width="${w}" height="${h}"></body>`);
  await page.goto('file://' + join(out, '_img.html')); await page.waitForTimeout(n.startsWith('ttt-') || n.startsWith('btn-') ? 900 : 2600);
  const ok = await page.evaluate(() => { const i = document.querySelector('img')!; return i.complete && i.naturalWidth > 0; });
  if (!ok) problems.push(`${n}-${m}: the image did not load`);
  await page.screenshot({ path: join(out, `${n}-${m}.png`) });

  // 2. Stepped frames inside the SVG document: animation and clipping checks.
  await page.setViewportSize({ width: Math.ceil(w), height: Math.ceil(h) });
  await openSvg(page, file);
  const count = await page.evaluate(() => document.getAnimations().length);
  const shots: Buffer[] = [];
  for (const t of [400, 2300, 5100]) { await seek(page, t); shots.push(await page.screenshot()); }
  if (count === 0 && !RESTING.has(n)) problems.push(`${n}-${m}: no animations`);
  else if (shots[0].equals(shots[1]) && shots[1].equals(shots[2]) && !RESTING.has(n)) problems.push(`${n}-${m}: frames identical, nothing moves`);
  for (const t of [0, 1500, 3700, 8000]) {
    await seek(page, t);
    const out_ = await page.evaluate(([W, H]) => {
      const bad: string[] = [];
      const els = [...document.querySelectorAll('text'), ...document.querySelectorAll('[class$="-root"]')] as SVGGraphicsElement[];
      for (const e of els) {
        const r = e.getBoundingClientRect(), op = getComputedStyle(e).opacity;
        if (!r.width || op === '0' || e.closest('[clip-path]')) continue;   // clipped on purpose (rolling digits)
        if (r.left < -1 || r.top < -1 || r.right > W + 1 || r.bottom > H + 1) bad.push(`${e.tagName}${e.textContent ? ` "${e.textContent.trim().slice(0, 24)}"` : ''} at ${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)}`);
      }
      return bad;
    }, [w, h]);
    for (const b of out_) problems.push(`${n}-${m} @${t}ms: outside the frame: ${b}`);
  }

  // 3. GIF of the looping sections: 4 s at 12 fps, scaled to at most 720 px wide.
  if (gifOnly && GIFS.includes(n)) {
    const fdir = join(out, '_frames'); rmSync(fdir, { recursive: true, force: true }); mkdirSync(fdir);
    for (let f = 0; f < 48; f++) { await seek(page, 1200 + f * (1000 / 12)); await page.screenshot({ path: join(fdir, `${String(f).padStart(3, '0')}.png`) }); }
    const scale = Math.min(720, w);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '12', '-i', join(fdir, '%03d.png'), '-vf', `scale=${scale}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`, '-loop', '0', join(out, `${n}-${m}.gif`)]);
    rmSync(fdir, { recursive: true, force: true });
  }
}
await browser.close();
rmSync(join(out, '_img.html'), { force: true });
writeFileSync(join(out, 'problems.txt'), problems.join('\n') + '\n');
console.log(`${names.length} sections × 2 themes rendered to ${out}`);
if (problems.length) { console.log(problems.join('\n')); process.exitCode = 1; } else console.log('all sections animate and stay inside their frames');
