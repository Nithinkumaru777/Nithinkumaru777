/**
 * Runs the real issue handler against a fake GitHub API in a throwaway copy of the repo:
 * one issue for every action type, plus a cooldown, a filtered message and a junk title.
 * Nothing is pushed and no issue is touched. Usage: npm run dry-run
 */
import { cpSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generate } from './generate.ts';
import { cached } from './lib/github.ts';
import { fresh, type World } from './lib/state.ts';
import { save } from './lib/store.ts';
import { processIssues, type Api, type Io, type Issue } from './interact.ts';

const root = process.cwd(), dir = mkdtempSync(join(tmpdir(), 'byte-dry-'));
for (const p of ['scripts', 'templates', 'package.json']) cpSync(join(root, p), join(dir, p), { recursive: true });
process.chdir(dir);
process.env.BYTE_OFFLINE = '1';

const titles = ['byte|pet', 'byte|feed|cookie', 'byte|play', 'byte|say|Hello from the dry run', 'byte|dance', 'byte|accessory|hat', 'byte|ttt|4', 'byte|pet', 'byte|say|visit http://spam.example', 'byte|fly', 'byte|feed|dosa'];
const users = ['asha', 'ravi', 'meera', 'kiran', 'dev', 'lata', 'arjun', 'asha', 'spammer', 'confused', 'ravi'];
const issues: Issue[] = titles.map((title, i) => ({ number: 101 + i, title, user: users[i] }));
const log: string[] = [], commits: string[] = [];
const api: Api = { open: async () => issues, comment: async (n, b) => { log.push(`#${n} comment ${b.length} chars`); }, close: async (n) => { log.push(`#${n} closed`); } };
// The clock moves 8 s per issue, so the second "asha" lands inside her cooldown while "ravi" (8 issues apart) does not.
let tick = Date.parse('2026-11-14T06:30:00Z');
const io: Io = {
  load: () => { const w: World = fresh(new Date(tick)); save(w); return w; },
  async commit(w, message, at) { save(w); await generate(w, cached(), { updatedAt: at.toISOString() }); commits.push(message); },
  async push() { log.push('push'); },
  reactionUrl: (id, mode) => `assets/react-${id}-${mode}.svg`,
};
const results = await processIssues(api, io, () => new Date((tick += 8_000)), () => 0.3);
for (const r of results) {
  const what = r.outcome ? (r.outcome.ok ? 'ok' : `refused (${r.outcome.reason})`) : 'not understood';
  console.log(`#${r.issue.number} ${r.issue.title.padEnd(36)} @${r.issue.user.padEnd(9)} ${what.padEnd(20)} ${r.message ?? ''}`);
  console.log(`    ${r.comment.split('\n\n')[1].split('\n')[0]}`);
}
const w = JSON.parse(readFileSync('state/byte.json', 'utf8')), g = JSON.parse(readFileSync('state/game.json', 'utf8'));
console.log(`\ncommits: ${commits.length}, comments: ${log.filter((l) => l.includes('comment')).length}, closed: ${log.filter((l) => l.includes('closed')).length}, pushes: ${log.filter((l) => l === 'push').length}`);
console.log(`Byte: level ${w.level}, xp ${w.xp}, happiness ${w.happiness}, energy ${w.energy}, hunger ${w.hunger}, wearing ${w.accessories.wearing}, guestbook ${w.guestbook.length}, board ${g.board.map((c: string | null) => c ?? '.').join('')}`);
const expect = (cond: boolean, msg: string) => { if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; } };
expect(results.length === titles.length, 'every issue handled');
expect(commits.length === 8, `8 commits expected, got ${commits.length}`);
expect(results[7].outcome?.ok === false && (results[7].outcome as any).reason === 'cooldown', 'second pet from asha hits the cooldown');
expect(results[8].outcome?.ok === false && (results[8].outcome as any).reason === 'filtered', 'link message filtered');
expect(results[9].action === null, 'junk title not understood');
expect(log.filter((l) => l.includes('closed')).length === titles.length, 'every issue closed');
expect(commits.every((c) => /^Byte: .+ by @\w+$/.test(c)), 'commit message format');
process.chdir(root);
if (!process.env.KEEP) rmSync(dir, { recursive: true, force: true }); else console.log('kept', dir);
console.log(process.exitCode ? 'dry run FAILED' : 'dry run passed');
