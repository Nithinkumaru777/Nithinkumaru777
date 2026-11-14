import type { Stats } from './lib/github.ts';
import { apply, fresh, xpFor, type World } from './lib/state.ts';

/** A busy, made-up world used only for previews and tests, so every card can be checked with real-looking content. */
export function demoWorld(now = new Date('2026-11-14T08:00:00Z')): World {
  const w = fresh(now); let t = now.getTime() - 3 * 3600_000;
  const people = ['asha-dev', 'ravikiran', 'meera_codes', 'kiran-b', 'devanshu', 'lata', 'arjun-s', 'priya-io', 'sameer', 'nikhil-k', 'zoya', 'tanvi-r', 'rohan'];
  const acts = [{ kind: 'pet' }, { kind: 'feed', food: 'dosa' }, { kind: 'play' }, { kind: 'say', message: 'Byte is the cutest robot on GitHub' }, { kind: 'dance' }, { kind: 'pet' },
    { kind: 'say', message: 'Namaste from Mysuru!' }, { kind: 'feed', food: 'chai' }, { kind: 'say', message: 'Loved the snake chase' }, { kind: 'pet' }, { kind: 'say', message: 'Hi Byte, keep coding' }, { kind: 'play' }, { kind: 'say', message: 'Saakh looks really useful' }] as const;
  people.forEach((u, i) => { for (let k = 0; k <= (i * 7) % 4; k++) apply(w, (k ? acts[(i + k) % acts.length].kind === 'say' ? { kind: 'pet' } : acts[(i + k) % acts.length] : acts[i]) as any, u, new Date((t += 70_000)), () => 0.5); });
  apply(w, { kind: 'accessory', item: 'shades' }, 'zoya', new Date((t += 70_000)));
  w.game.board = ['X', null, 'O', null, 'X', null, null, null, 'O']; w.game.score = { byte: 7, friends: 3, draws: 4 }; w.game.moves = 61;
  w.byte.xp = xpFor(12) + 40; w.byte.level = 12; w.byte.happiness = 88; w.byte.energy = 64; w.byte.hunger = 22; w.byte.mood = 'happy'; w.byte.pets.today = 9; w.byte.pets.total = 214;
  return w;
}
export function demoStats(): Stats {
  const cal = Array.from({ length: 371 }, (_, i) => { const x = Math.sin(i * 0.37) + Math.sin(i * 0.11) + (i % 7 === 0 ? -1.5 : 0); return x < 0 ? 0 : Math.round(x * 4 + (i > 300 ? 3 : 0)); });
  return { live: true, fetchedAt: '2026-11-14T08:00:00Z', stars: 48, commitsYear: 1286, prs: 37, issues: 21, repos: 26, followers: 64,
    languages: [{ name: 'TypeScript', share: 0.38 }, { name: 'Python', share: 0.27 }, { name: 'JavaScript', share: 0.16 }, { name: 'HTML', share: 0.11 }, { name: 'CSS', share: 0.08 }],
    streak: { current: 23, longest: 41, alive: true }, week: ['2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14'].map((day, i) => ({ day, count: [4, 9, 6, 14, 3, 11, 5][i] })),
    commits24h: 5, lastPush: null, calendar: cal, projects: { saakh: { stars: 12, description: null }, 'meeting-action-log': { stars: 6, description: null }, NexusOptimize: { stars: 19, description: null }, 'gitpulse-desktop': { stars: 8, description: null } } };
}
