import { existsSync, readFileSync } from 'node:fs';
import { avatarsFor, build, generate, readMeta } from './generate.ts';
import { fetchStats, saveStats } from './lib/github.ts';
import { decay, moodFor } from './lib/state.ts';
import { load, save } from './lib/store.ts';

/** Star totals that make Byte throw a party for a day. */
export const MILESTONES = [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000];

/** Scheduled refresh: let time pass, pick the mood, redraw. Writes nothing when the pictures would come out the same. */
const now = new Date(), w = load(), s = await fetchStats(), b = w.byte;
decay(b, now);
const reached = s.live ? Math.max(0, ...MILESTONES.filter((m) => s.stars >= m)) : 0;
const party = reached > b.milestone;
if (party) { b.milestone = reached; b.moodUntil = new Date(now.getTime() + 24 * 3600_000).toISOString(); }
if (s.lastPush) b.lastPush = s.lastPush;
b.mood = moodFor(b, now, { lastPush: s.lastPush, commitsLast24h: s.commits24h, milestone: party });
if (party) b.mood = 'celebrating';

// Render with the old timestamp first: if nothing but the clock would change, leave the repo alone.
const before = build(w, s, readMeta(), await avatarsFor(w.friends.recent.map((r) => r.user)));
const same = [...before].every(([path, content]) => existsSync(path) && readFileSync(path, 'utf8') === content);
if (same && !process.env.BYTE_FORCE) console.log('nothing changed');
else {
  save(w); saveStats(s);
  const changed = await generate(w, s, { updatedAt: now.toISOString() });
  console.log(`mood: ${b.mood}; stats ${s.live ? 'live' : 'cached'}; ${changed.length} file(s) changed`);
}
