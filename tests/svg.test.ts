import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { build } from '../scripts/generate.ts';
import { demoStats, demoWorld } from '../scripts/demo.ts';
import { emptyStats } from '../scripts/lib/github.ts';
import { fresh } from '../scripts/lib/state.ts';
import { MOODS } from '../scripts/lib/byte.ts';

process.env.BYTE_OFFLINE = '1';
const META = { updatedAt: '2026-11-14T08:00:00Z' };
const worlds = { empty: () => build(fresh(new Date(META.updatedAt)), emptyStats(), META, {}), demo: () => build(demoWorld(), demoStats(), META, {}) };
// Byte's card in every mood at every evolution stage, so no combination slips through.
const moodWorlds = MOODS.flatMap((mood) => [1, 5, 10, 20].map((level) => { const w = demoWorld(); w.byte.mood = mood; w.byte.level = level; w.byte.accessories.wearing = ['hat', 'shades', 'bow', null][level % 4]; return build(w, demoStats(), META, {}); }));

for (const [name, make] of Object.entries(worlds)) test(`every SVG is valid, small and self-contained (${name} world)`, () => {
  const files = make(), dir = mkdtempSync(join(tmpdir(), 'byte-svg-')), svgs = [...files].filter(([p]) => p.endsWith('.svg'));
  assert.ok(svgs.length >= 80, `expected 80+ SVGs, got ${svgs.length}`);
  for (const [path, svg] of svgs) {
    const f = join(dir, path.replace(/\//g, '_')); writeFileSync(f, svg);
    execFileSync('xmllint', ['--noout', f]);                                          // throws on malformed XML
    assert.ok(Buffer.byteLength(svg) < 500 * 1024, `${path} is ${Buffer.byteLength(svg)} bytes`);
    assert.doesNotMatch(svg, /<script|on(load|click|begin)=|javascript:/i, `${path} has script`);
    assert.doesNotMatch(svg, /(href|src)="(?!data:|#)/, `${path} references an external file`);
    assert.doesNotMatch(svg, /url\((?!data:|#)/, `${path} has an external url()`);
    assert.doesNotMatch(svg, /@import/, `${path} imports CSS`);
    assert.match(svg, /prefers-reduced-motion/, `${path} ignores reduced motion`);
    assert.match(svg, /<title>[^<]+<\/title>/, `${path} has no title`);
    assert.doesNotMatch(svg, /NaN|undefined|\[object/, `${path} has a rendering glitch`);
  }
});
test('Byte card renders for every mood × stage × accessory', () => {
  for (const files of moodWorlds) { const svg = files.get('assets/byte-light.svg')!; assert.ok(svg.length < 500 * 1024); assert.doesNotMatch(svg, /NaN|undefined/); }
});
test('README: light and dark pictures, cache-busted, every image exists, issue links pre-filled', () => {
  const files = worlds.demo(), md = files.get('README.md')!;
  assert.doesNotMatch(md, /\{\{\w+\}\}/, 'unfilled placeholder');
  const refs = [...md.matchAll(/(?:src|srcset)="(assets\/[^"?]+)\?v=([0-9a-f]{8})"/g)];
  assert.ok(refs.length >= 60);
  for (const [, path] of refs) assert.ok(files.has(path), `missing ${path}`);
  assert.equal((md.match(/<picture>/g) ?? []).length, (md.match(/prefers-color-scheme: dark/g) ?? []).length);
  for (const t of ['byte|pet', 'byte|feed|cookie', 'byte|play', 'byte|say|Hi Byte!', 'byte|dance', 'byte|accessory|hat']) assert.ok(md.includes(`title=${encodeURIComponent(t)}`), t);
  assert.ok(md.includes(encodeURIComponent('byte|ttt|1')), 'empty square links to its move');
  assert.ok(!md.includes(encodeURIComponent('byte|ttt|0')), 'taken square has no link');
  assert.doesNotMatch(md, /@gmail|mailto:/, 'no email address on the profile');
});
test('the build is deterministic', () => { const a = worlds.demo(), b = worlds.demo(); for (const [k, v] of a) assert.equal(b.get(k), v, k); });
