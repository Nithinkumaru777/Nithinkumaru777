import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { config, issueUrl, repoUrl } from './config.ts';
import { about } from './gen/about.ts';
import { BUTTONS, button, byteCard, reaction, REACTION_IDS } from './gen/bytecard.ts';
import { footer, hero } from './gen/hero.ts';
import { project } from './gen/projects.ts';
import { snake } from './gen/snake.ts';
import { friends, guestbook, tttCell, tttStatus } from './gen/social.ts';
import { stack } from './gen/stack.ts';
import { languages, statsCard, streak, week } from './gen/stats.ts';
import { cached, type Stats } from './lib/github.ts';
import { istClock, type World } from './lib/state.ts';
import { load } from './lib/store.ts';
import { MODES, themes } from './lib/theme.ts';
import { winner } from './lib/ttt.ts';

export interface Meta { updatedAt: string }
export const readMeta = (): Meta => (existsSync('state/meta.json') ? JSON.parse(readFileSync('state/meta.json', 'utf8')) : { updatedAt: new Date().toISOString() });
const AVATARS = 'state/avatars.json';

/** Fetch each visitor's avatar once, shrink it to 60 px and keep it as a data URI so the friends card needs no network. */
export async function avatarsFor(users: string[]): Promise<Record<string, string>> {
  const old: Record<string, string> = existsSync(AVATARS) ? JSON.parse(readFileSync(AVATARS, 'utf8')) : {};
  const out: Record<string, string> = {};
  for (const u of users) {
    if (old[u]) { out[u] = old[u]; continue; }
    if (process.env.BYTE_OFFLINE) continue;
    try {
      const res = await fetch(`https://github.com/${encodeURIComponent(u)}.png?size=120`, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const { default: sharp } = await import('sharp');
      const png = await sharp(Buffer.from(await res.arrayBuffer())).resize(60, 60, { fit: 'cover' }).png({ palette: true, colours: 64 }).toBuffer();
      out[u] = `data:image/png;base64,${png.toString('base64')}`;
    } catch { /* the card falls back to an initial */ }
  }
  return out;
}

const hash = (s: string) => createHash('sha1').update(s).digest('hex').slice(0, 8);

/** Build every asset and the README in memory. Pure: same inputs, same bytes. */
export function build(w: World, s: Stats, meta: Meta, avatars: Record<string, string>): Map<string, string> {
  const files = new Map<string, string>(), now = new Date(meta.updatedAt), alts = new Map<string, string>();
  const put = (name: string, make: (t: (typeof themes)['light']) => string) => { for (const m of MODES) { const svg = make(themes[m]); files.set(`assets/${name}-${m}.svg`, svg); if (m === 'light') alts.set(name, /aria-label="([^"]*)"/.exec(svg)?.[1] ?? name); } };
  put('hero', (t) => hero(t, w, istClock(now)));
  put('byte', (t) => byteCard(t, w));
  BUTTONS.forEach((b, i) => put(`btn-${b.id}`, (t) => button(t, b.id, b.label, i)));
  for (const id of REACTION_IDS) put(`react-${id}`, (t) => reaction(t, id, w));
  put('about', (t) => about(t));
  put('stack', (t) => stack(t));
  config.projects.forEach((p, i) => put(`project-${p.repo.toLowerCase()}`, (t) => project(t, p, s, i)));
  put('stats', (t) => statsCard(t, s)); put('languages', (t) => languages(t, s)); put('streak', (t) => streak(t, s)); put('week', (t) => week(t, s, now));
  put('snake', (t) => snake(t, s, w));
  put('friends', (t) => friends(t, w, avatars));
  for (let i = 0; i < 9; i++) put(`ttt-${i}`, (t) => tttCell(t, w, i));
  put('ttt-status', (t) => tttStatus(t, w));
  put('guestbook', (t) => guestbook(t, w));
  put('footer', (t) => footer(t, w));

  const pic = (name: string, width: string, href?: string) => {
    const l = `assets/${name}-light.svg`, d = `assets/${name}-dark.svg`;
    const img = `<picture><source media="(prefers-color-scheme: dark)" srcset="${d}?v=${hash(files.get(d)!)}"><img src="${l}?v=${hash(files.get(l)!)}" width="${width}" alt="${alts.get(name)}"></picture>`;
    return href ? `<a href="${href}">${img}</a>` : img;
  };
  const over = !!winner(w.game.board) || w.game.board.every(Boolean);
  const cell = (i: number) => (w.game.board[i] && !over ? pic(`ttt-${i}`, '104') : pic(`ttt-${i}`, '104', issueUrl(`byte|ttt|${i}`)));
  const blocks: Record<string, string> = {
    hero: pic('hero', '100%', config.site),
    byte: pic('byte', '600'),
    buttons: BUTTONS.map((b) => pic(`btn-${b.id}`, '150', issueUrl(b.title))).join('\n'),
    extras: [['feed a dosa', 'byte|feed|dosa'], ['pour some chai', 'byte|feed|chai'], ['shades', 'byte|accessory|shades'], ['bow tie', 'byte|accessory|bow']].map(([label, title]) => `<a href="${issueUrl(title)}">${label}</a>`).join(', '),
    about: pic('about', '100%'),
    stack: pic('stack', '100%'),
    projects: config.projects.map((p, i) => pic(`project-${p.repo.toLowerCase()}`, '49%', `https://github.com/${config.user}/${p.repo}`) + (i % 2 ? '\n' : '')).join('\n').trim(),
    stats: ['stats', 'languages', 'streak', 'week'].map((n, i) => pic(n, '49%') + (i % 2 ? '\n' : '')).join('\n').trim(),
    snake: pic('snake', '100%'),
    friends: pic('friends', '100%'),
    ttt: `${pic('ttt-status', '420')}\n<br>\n${[0, 1, 2].map((r) => [0, 1, 2].map((c) => cell(r * 3 + c)).join('\n')).join('\n<br>\n')}`,
    guestbook: pic('guestbook', '100%', issueUrl('byte|say|Hi Byte!')),
    footer: pic('footer', '100%', config.site),
    site: config.site, github: config.links.github, repo: repoUrl,
  };
  const tpl = readFileSync('templates/README.tpl.md', 'utf8');
  files.set('README.md', tpl.replace(/\{\{(\w+)\}\}/g, (m, k) => blocks[k] ?? m));
  return files;
}

/** Write the build to disk. Returns the paths whose bytes changed. */
export function write(files: Map<string, string>): string[] {
  mkdirSync('assets', { recursive: true });
  const changed: string[] = [];
  for (const [path, content] of files) if (!existsSync(path) || readFileSync(path, 'utf8') !== content) { writeFileSync(path, content); changed.push(path); }
  for (const f of readdirSync('assets')) if (f.endsWith('.svg') && !f.startsWith('snk-') && !files.has(`assets/${f}`)) rmSync(`assets/${f}`);
  return changed;
}

export async function generate(w: World = load(), s: Stats = cached(), meta: Meta = { updatedAt: new Date().toISOString() }) {
  const avatars = await avatarsFor(w.friends.recent.map((r) => r.user));
  const changed = write(build(w, s, meta, avatars));
  writeFileSync(AVATARS, JSON.stringify(avatars, null, 1) + '\n');
  writeFileSync('state/meta.json', JSON.stringify(meta, null, 2) + '\n');
  return changed;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const changed = await generate();
  console.log(`generated ${changed.length} changed file(s)`);
}
