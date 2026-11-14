import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cleanMessage } from '../scripts/lib/filter.ts';
import { parseTitle } from '../scripts/lib/parse.ts';
import { REPLY_COUNT, reactionFor, replyFor } from '../scripts/lib/replies.ts';
import { apply, decay, EVOLVE_AT, fresh, levelFor, LIMITS, moodFor, xpFor } from '../scripts/lib/state.ts';
import { stageFor } from '../scripts/lib/byte.ts';
import { byteMove, full, winner, type Cell } from '../scripts/lib/ttt.ts';
import { streakOf } from '../scripts/lib/github.ts';

const NOON = new Date('2026-11-14T06:30:00Z');           // 12:00 IST
const later = (ms: number) => new Date(NOON.getTime() + ms);

test('parser: every button title', () => {
  assert.deepEqual(parseTitle('byte|pet'), { kind: 'pet' });
  assert.deepEqual(parseTitle('byte|feed|cookie'), { kind: 'feed', food: 'cookie' });
  assert.deepEqual(parseTitle('byte|feed|dosa'), { kind: 'feed', food: 'dosa' });
  assert.deepEqual(parseTitle('byte|play'), { kind: 'play' });
  assert.deepEqual(parseTitle('byte|dance'), { kind: 'dance' });
  assert.deepEqual(parseTitle('byte|say|Hi Byte!'), { kind: 'say', message: 'Hi Byte!' });
  assert.deepEqual(parseTitle('byte|accessory|hat'), { kind: 'accessory', item: 'hat' });
  assert.deepEqual(parseTitle('byte|ttt|4'), { kind: 'ttt', cell: 4 });
});
test('parser: tolerant of case and spaces, strict about nonsense', () => {
  assert.deepEqual(parseTitle('  Byte | PET '), { kind: 'pet' });
  assert.deepEqual(parseTitle('byte|feed|pizza'), { kind: 'feed', food: 'cookie' });
  assert.deepEqual(parseTitle('byte|say|a|b'), { kind: 'say', message: 'a|b' });
  for (const bad of ['', 'hello', 'bug: site is down', 'byte|', 'byte|fly', 'byte|say|', 'byte|accessory|crown', 'byte|ttt|9', 'byte|ttt|x', 'bytes|pet']) assert.equal(parseTitle(bad), null, bad);
});

test('guestbook filter: length, links, mentions, profanity', () => {
  assert.equal(cleanMessage('  Hello   Byte!  '), 'Hello Byte!');
  assert.equal(cleanMessage('x'.repeat(200))!.length, 80);
  for (const bad of ['visit http://spam.example', 'go to www.spam.example now', 'buy at spam.com', 'hey @someone look', 'you are sh1t', 'what the FUCK', '   ', '<img src=x>']) assert.equal(cleanMessage(bad), null, bad);
});

test('cooldown: one action per user per minute', () => {
  const w = fresh(NOON);
  assert.equal(apply(w, { kind: 'pet' }, 'asha', NOON).ok, true);
  const again = apply(w, { kind: 'pet' }, 'asha', later(20_000));
  assert.deepEqual(again, { ok: false, reason: 'cooldown', waitSec: 40 });
  assert.equal(apply(w, { kind: 'pet' }, 'ravi', later(20_000)).ok, true, 'another user is not blocked');
  assert.equal(apply(w, { kind: 'pet' }, 'asha', later(60_000)).ok, true);
  assert.equal(w.byte.pets.total, 3);
});
test('caps: per user per day, per day overall, reset at IST midnight', () => {
  const w = fresh(NOON);
  for (let i = 0; i < LIMITS.perUserPerDay; i++) assert.equal(apply(w, { kind: 'pet' }, 'asha', later(i * 61_000)).ok, true);
  assert.deepEqual(apply(w, { kind: 'pet' }, 'asha', later(40 * 61_000)), { ok: false, reason: 'user-cap' });
  assert.equal(apply(w, { kind: 'pet' }, 'asha', later(24 * 3600_000)).ok, true, 'new day');
  const w2 = fresh(NOON); w2.byte.daily.count = LIMITS.perDay;
  assert.deepEqual(apply(w2, { kind: 'pet' }, 'ravi', NOON), { ok: false, reason: 'day-cap' });
  assert.equal(w2.byte.pets.total, 0, 'a refused action changes nothing');
});

test('state transitions for each action', () => {
  const w = fresh(NOON), b = w.byte; let t = 0; const at = () => later((t += 61_000));
  apply(w, { kind: 'pet' }, 'u', at()); assert.equal(b.happiness, 78); assert.equal(b.pets.today, 1);
  apply(w, { kind: 'feed', food: 'dosa' }, 'u', at()); assert.equal(b.hunger, 5); assert.equal(b.energy, 85);
  apply(w, { kind: 'play' }, 'u', at()); assert.equal(b.energy, 73); assert.equal(b.hunger, 11);
  const d = apply(w, { kind: 'dance' }, 'u', at()); assert.equal(d.ok, true); assert.equal(b.mood, 'excited');
  apply(w, { kind: 'say', message: 'Namaste Byte' }, 'u', at()); assert.deepEqual(b.guestbook.map((g) => g.text), ['Namaste Byte']);
  assert.deepEqual(apply(w, { kind: 'say', message: 'see http://x.co' }, 'u', at()), { ok: false, reason: 'filtered' });
  const a1 = apply(w, { kind: 'accessory', item: 'hat' }, 'u', at()); assert.equal(a1.ok && a1.note, 'unlocked'); assert.equal(b.accessories.wearing, 'hat');
  const a2 = apply(w, { kind: 'accessory', item: 'hat' }, 'u', at()); assert.equal(a2.ok && a2.note, 'off'); assert.equal(b.accessories.wearing, null);
  const a3 = apply(w, { kind: 'accessory', item: 'hat' }, 'u', at()); assert.equal(a3.ok && a3.note, 'on');
  b.energy = 4; assert.deepEqual(apply(w, { kind: 'play' }, 'u', at()), { ok: false, reason: 'tired' });
  assert.equal(w.friends.recent[0].user, 'u'); assert.equal(w.friends.recent.length, 1); assert.ok(w.friends.counts.u >= 8);
});
test('friends list keeps the 12 most recent, newest first', () => {
  const w = fresh(NOON);
  for (let i = 0; i < 15; i++) apply(w, { kind: 'pet' }, `user${i}`, later(i * 1000));
  assert.equal(w.friends.recent.length, 12); assert.equal(w.friends.recent[0].user, 'user14'); assert.equal(Object.keys(w.friends.counts).length, 15);
});

test('levels: curve, level-ups and evolutions at 5, 10 and 20', () => {
  assert.equal(xpFor(1), 0); assert.equal(xpFor(2), 15); assert.equal(xpFor(20), 2850);
  assert.equal(levelFor(0), 1); assert.equal(levelFor(14), 1); assert.equal(levelFor(15), 2); assert.equal(levelFor(999_999), 20);
  for (let l = 2; l <= 20; l++) assert.ok(xpFor(l) > xpFor(l - 1));
  assert.deepEqual([1, 4, 5, 9, 10, 19, 20].map(stageFor), [0, 0, 1, 1, 2, 2, 3]);
  const w = fresh(NOON); w.byte.xp = xpFor(5) - 2; w.byte.level = 4;
  const o = apply(w, { kind: 'pet' }, 'u', NOON);
  assert.ok(o.ok && o.levelUp === 5 && o.evolved); assert.equal(w.byte.mood, 'excited');
  const w2 = fresh(NOON); w2.byte.xp = xpFor(3) - 2; w2.byte.level = 2;
  const o2 = apply(w2, { kind: 'pet' }, 'u', NOON); assert.ok(o2.ok && o2.levelUp === 3 && !o2.evolved);
  const w3 = fresh(NOON); w3.byte.xp = xpFor(20) + 500; w3.byte.level = 20;
  const o3 = apply(w3, { kind: 'play' }, 'u', NOON); assert.ok(o3.ok && o3.levelUp === null); assert.equal(w3.byte.level, 20);
  assert.deepEqual(EVOLVE_AT, [5, 10, 20]);
});

test('decay and moods follow the IST clock', () => {
  const b = fresh(NOON).byte;
  decay(b, later(3 * 3600_000)); assert.equal(b.hunger, 39); assert.equal(b.energy, 89); assert.equal(b.happiness, 66);
  const at = (h: number) => new Date(Date.UTC(2026, 10, 14, h - 5, -30));     // h o'clock IST
  const calm = () => ({ ...fresh(NOON).byte, happiness: 60 });
  assert.equal(moodFor(calm(), at(12), {}), 'idle');
  assert.equal(moodFor(calm(), at(23), {}), 'sleeping'); assert.equal(moodFor(calm(), at(3), {}), 'sleeping'); assert.equal(moodFor(calm(), at(7), {}), 'idle');
  assert.equal(moodFor(calm(), at(22), {}), 'sleepy');
  assert.equal(moodFor({ ...calm(), hunger: 80 }, at(12), {}), 'hungry');
  assert.equal(moodFor({ ...calm(), happiness: 90 }, at(12), {}), 'happy');
  assert.equal(moodFor({ ...calm(), energy: 10 }, at(12), {}), 'sleepy');
  assert.equal(moodFor(calm(), at(12), { lastPush: new Date(at(12).getTime() - 3600_000).toISOString() }), 'coding');
  assert.equal(moodFor(calm(), at(12), { lastPush: new Date(at(12).getTime() - 5 * 3600_000).toISOString() }), 'idle');
  assert.equal(moodFor(calm(), at(12), { commitsLast24h: 20 }), 'excited');
  assert.equal(moodFor(calm(), at(2), { milestone: true }), 'celebrating');
});

test('tic-tac-toe: Byte never loses when it does not slip', () => {
  let games = 0;
  const walk = (b: Cell[]) => {
    for (let i = 0; i < 9; i++) {
      if (b[i]) continue;
      const n = b.slice(); n[i] = 'X';
      let end = winner(n);
      if (!end && !full(n)) { n[byteMove(n, 0)] = 'O'; end = winner(n); }
      if (end) { assert.equal(end.who, 'O', `visitor won with ${n}`); games++; continue; }
      if (full(n)) { games++; continue; }
      walk(n);
    }
  };
  walk(Array(9).fill(null));
  assert.ok(games > 100);
});
test('tic-tac-toe: takes the win, blocks the threat, can slip, keeps score', () => {
  assert.equal(byteMove(['O', 'O', null, 'X', 'X', null, null, null, null], 0), 2);
  assert.equal(byteMove(['X', 'X', null, null, 'O', null, null, null, null], 0), 2);
  const slips = new Set<number>(); let r = 0;
  for (let i = 0; i < 40; i++) slips.add(byteMove(['X', 'X', null, null, 'O', null, null, null, null], 1, () => ((r += 0.137) % 1)));
  assert.ok(slips.size > 1, 'with slip = 1 Byte plays random legal squares');
  const w = fresh(NOON); let t = 0; const at = () => later((t += 61_000));
  w.game.board = ['X', 'X', null, 'O', 'O', null, null, null, null];
  const win = apply(w, { kind: 'ttt', cell: 2 }, 'asha', at());
  assert.ok(win.ok && win.game === 'win'); assert.deepEqual(w.game.score, { byte: 0, friends: 1, draws: 0 }); assert.deepEqual(w.game.last.line, [0, 1, 2]);
  const next = apply(w, { kind: 'ttt', cell: 4 }, 'asha', at(), () => 0.99);
  assert.ok(next.ok && next.game === 'move'); assert.equal(w.game.board.filter(Boolean).length, 2, 'a finished board is cleared by the next move');
  assert.deepEqual(apply(w, { kind: 'ttt', cell: 4 }, 'asha', at()), { ok: false, reason: 'taken' });
});

test('replies: at least 30 templates, filled in, with a matching reaction', () => {
  assert.ok(REPLY_COUNT >= 30, String(REPLY_COUNT));
  const w = fresh(NOON), o = apply(w, { kind: 'feed', food: 'chai' }, 'asha', NOON);
  const text = replyFor(o, 'asha', () => 0);
  assert.match(text, /@asha/); assert.match(text, /chai/); assert.doesNotMatch(text, /\{\w+\}/); assert.equal(reactionFor(o), 'feed');
  assert.match(replyFor({ ok: false, reason: 'cooldown', waitSec: 42 }, 'asha', () => 0), /42/);
});

test('streak maths', () => {
  const d = (...n: number[]) => n.map((c, i) => ({ date: String(i), contributionCount: c }));
  assert.deepEqual(streakOf(d(1, 1, 0, 1, 1, 1)), { current: 3, longest: 3, alive: true });
  assert.deepEqual(streakOf(d(1, 1, 1, 1, 0)), { current: 4, longest: 4, alive: true }, 'today may still be empty');
  assert.deepEqual(streakOf(d(1, 1, 0, 0)), { current: 0, longest: 2, alive: false });
});

test('cooldown counts from when the visitor opened the issue, not from when CI got to it', async () => {
  const { processIssues } = await import('../scripts/interact.ts');
  const run = async (gapMs: number) => {
    const w = fresh(NOON), at = (ms: number) => later(ms).toISOString();
    const issues = [{ number: 1, title: 'byte|pet', user: 'asha', createdAt: at(0) }, { number: 2, title: 'byte|dance', user: 'asha', createdAt: at(gapMs) }];
    const io = { load: () => w, commit: async () => {}, push: async () => {}, reactionUrl: () => 'x' };
    const api = { open: async () => issues, comment: async () => {}, close: async () => {} };
    return processIssues(api, io, () => later(gapMs + 5 * 60_000));          // both handled in one run, minutes later
  };
  assert.ok((await run(61_000)).every((r) => r.outcome?.ok), 'issues opened 61 s apart are both accepted');
  assert.equal((await run(20_000))[1].outcome?.ok, false, 'issues opened 20 s apart still hit the cooldown');
});
