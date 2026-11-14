/**
 * Records the hover previews for the site's project cards from the same animations the README cards use.
 * Writes site/public/media/<repo>.{webm,mp4,png}. Usage: npx tsx scripts/site-media.ts
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { config } from './config.ts';
import { art } from './gen/projects.ts';
import { doc } from './lib/svg.ts';
import { themes } from './lib/theme.ts';

const out = resolve('site/public/media'), tmp = resolve('previews/_media');
mkdirSync(out, { recursive: true }); rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
const FPS = 24, SECONDS = 6;
for (const p of config.projects) {
  const t = themes.light, a = art(t, p.art);
  // The illustration lives in a 200 × 150 box; draw it at 2× on the card colour.
  const svg = doc({ w: 400, h: 300, t, title: p.title, css: a.css, fonts: ['b', 'm'], frame: false, body: `<rect width="400" height="300" fill="${t.bg}"/><g transform="scale(2)">${a.svg}</g>` });
  const file = join(tmp, `${p.repo}.svg`); writeFileSync(file, svg);
  await page.goto('file://' + file); await page.evaluate(() => document.fonts.ready);
  await page.setViewportSize({ width: 800, height: 600 });
  await page.evaluate(() => { const s = document.documentElement; s.setAttribute('width', '800'); s.setAttribute('height', '600'); document.getAnimations().forEach((x) => x.pause()); });
  const frames = join(tmp, p.repo); mkdirSync(frames);
  for (let f = 0; f < FPS * SECONDS; f++) {
    await page.evaluate((ms) => document.getAnimations().forEach((x) => { x.currentTime = ms; }), 600 + (f * 1000) / FPS);
    await page.screenshot({ path: join(frames, `${String(f).padStart(4, '0')}.png`) });
  }
  const name = p.repo.toLowerCase(), input = ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(frames, '%04d.png')];
  execFileSync('ffmpeg', [...input, '-vf', 'scale=400:300', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '40', '-row-mt', '1', '-an', join(out, `${name}.webm`)]);
  execFileSync('ffmpeg', [...input, '-vf', 'scale=400:300', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '28', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', join(out, `${name}.mp4`)]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', join(frames, `${String(FPS * 2).padStart(4, '0')}.png`), '-vf', 'scale=400:300', join(out, `${name}.png`)]);
  console.log('recorded', name);
}
await browser.close();
rmSync(tmp, { recursive: true, force: true });
