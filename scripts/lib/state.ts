import type { Action } from './parse.ts';
import type { Mood } from './byte.ts';
import { cleanMessage } from './filter.ts';
import { byteMove, full, winner, type Cell } from './ttt.ts';

export interface ByteState {
  name: string; happiness: number; energy: number; hunger: number; xp: number; level: number;
  mood: Mood; moodUntil: string | null;
  pets: { today: number; total: number; day: string };
  accessories: { owned: string[]; wearing: string | null };
  lastDecay: string; lastPush: string | null; milestone: number;
  /** Per-visitor bookkeeping for cooldowns and daily caps. */
  users: Record<string, { last: string; day: string; today: number; total: number }>;
  daily: { day: string; count: number };
  guestbook: { user: string; text: string; at: string }[];
}
export interface Friends { recent: { user: string; action: string; at: string }[]; counts: Record<string, number> }
export interface Game { board: Cell[]; score: { byte: number; friends: number; draws: number }; last: { result: 'win' | 'lose' | 'draw' | null; line: number[]; by: string | null }; moves: number }
export interface World { byte: ByteState; friends: Friends; game: Game }

export const LIMITS = { cooldownMs: 60_000, perUserPerDay: 25, perDay: 400, maxLevel: 20 };
export const ist = (d: Date) => new Date(d.getTime() + 5.5 * 3600_000);
export const istDay = (d: Date) => ist(d).toISOString().slice(0, 10);
export const istHour = (d: Date) => ist(d).getUTCHours();
export const istClock = (d: Date) => ist(d).toISOString().slice(11, 16);
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** Total XP needed to reach a level. Level 1 is 0 XP, level 20 is 2,850 XP. */
export const xpFor = (level: number) => Math.round(15 * (level - 1) * level / 2);
export const levelFor = (xp: number) => { let l = 1; while (l < LIMITS.maxLevel && xp >= xpFor(l + 1)) l++; return l; };
export const EVOLVE_AT = [5, 10, 20];

export const fresh = (now = new Date()): World => ({
  byte: { name: 'Byte', happiness: 70, energy: 80, hunger: 30, xp: 0, level: 1, mood: 'idle', moodUntil: null, pets: { today: 0, total: 0, day: istDay(now) },
    accessories: { owned: [], wearing: null }, lastDecay: now.toISOString(), lastPush: null, milestone: 0, users: {}, daily: { day: istDay(now), count: 0 }, guestbook: [] },
  friends: { recent: [], counts: {} },
  game: { board: Array(9).fill(null), score: { byte: 0, friends: 0, draws: 0 }, last: { result: null, line: [], by: null }, moves: 0 },
});

export type Outcome =
  | { ok: true; action: Action; levelUp: number | null; evolved: boolean; note?: string; game?: 'win' | 'lose' | 'draw' | 'move'; byteCell?: number }
  | { ok: false; reason: 'cooldown' | 'user-cap' | 'day-cap' | 'filtered' | 'taken' | 'tired'; waitSec?: number };

/** Apply one visitor action. Pure apart from mutating `w`: no clock, network or disk access. */
export function apply(w: World, action: Action, user: string, now: Date, random: () => number = Math.random): Outcome {
  const b = w.byte, day = istDay(now);
  if (b.daily.day !== day) b.daily = { day, count: 0 };
  if (b.pets.day !== day) b.pets = { ...b.pets, today: 0, day };
  const u = (b.users[user] ??= { last: new Date(0).toISOString(), day, today: 0, total: 0 });
  if (u.day !== day) { u.day = day; u.today = 0; }
  const since = now.getTime() - new Date(u.last).getTime();
  if (since < LIMITS.cooldownMs) return { ok: false, reason: 'cooldown', waitSec: Math.ceil((LIMITS.cooldownMs - since) / 1000) };
  if (u.today >= LIMITS.perUserPerDay) return { ok: false, reason: 'user-cap' };
  if (b.daily.count >= LIMITS.perDay) return { ok: false, reason: 'day-cap' };

  let xp = 0, note: string | undefined, game: 'win' | 'lose' | 'draw' | 'move' | undefined, byteCell: number | undefined;
  switch (action.kind) {
    case 'pet': b.happiness = clamp(b.happiness + 8); b.pets.today++; b.pets.total++; xp = 4; break;
    case 'feed': b.hunger = clamp(b.hunger - 25); b.happiness = clamp(b.happiness + 3); b.energy = clamp(b.energy + 5); xp = 5; break;
    case 'play':
      if (b.energy < 10) return { ok: false, reason: 'tired' };
      b.energy = clamp(b.energy - 12); b.hunger = clamp(b.hunger + 6); b.happiness = clamp(b.happiness + 6); xp = 10; break;
    case 'dance':
      if (b.energy < 6) return { ok: false, reason: 'tired' };
      b.energy = clamp(b.energy - 6); b.happiness = clamp(b.happiness + 5); xp = 6; break;
    case 'say': {
      const text = cleanMessage(action.message);
      if (!text) return { ok: false, reason: 'filtered' };
      b.guestbook = [{ user, text, at: now.toISOString() }, ...b.guestbook].slice(0, 20);
      b.happiness = clamp(b.happiness + 4); xp = 5; break;
    }
    case 'accessory': {
      const a = b.accessories;
      if (!a.owned.includes(action.item)) { a.owned.push(action.item); a.wearing = action.item; note = 'unlocked'; }
      else if (a.wearing === action.item) { a.wearing = null; note = 'off'; }
      else { a.wearing = action.item; note = 'on'; }
      xp = 3; break;
    }
    case 'ttt': {
      const g = w.game;
      if (winner(g.board) || full(g.board)) g.board = Array(9).fill(null);
      if (g.board[action.cell]) return { ok: false, reason: 'taken' };
      if (g.board.every((c) => !c)) g.last = { result: null, line: [], by: null };
      g.board[action.cell] = 'X'; g.moves++; xp = 3; game = 'move';
      let end = winner(g.board);
      if (!end && !full(g.board)) { byteCell = byteMove(g.board, 0.15, random); g.board[byteCell] = 'O'; end = winner(g.board); }
      if (end) { game = end.who === 'X' ? 'win' : 'lose'; g.score[end.who === 'X' ? 'friends' : 'byte']++; g.last = { result: game, line: end.line, by: user }; if (game === 'win') xp += 12; }
      else if (full(g.board)) { game = 'draw'; g.score.draws++; g.last = { result: 'draw', line: [], by: user }; xp += 4; }
      break;
    }
  }
  u.last = now.toISOString(); u.today++; u.total++; b.daily.count++;
  w.friends.recent = [{ user, action: action.kind, at: now.toISOString() }, ...w.friends.recent.filter((r) => r.user !== user)].slice(0, 12);
  w.friends.counts[user] = (w.friends.counts[user] ?? 0) + 1;

  const before = b.level;
  b.xp += xp; b.level = levelFor(b.xp);
  const levelUp = b.level > before ? b.level : null;
  const evolved = levelUp !== null && EVOLVE_AT.some((l) => before < l && b.level >= l);
  if (levelUp || action.kind === 'dance') { b.mood = 'excited'; b.moodUntil = new Date(now.getTime() + 3 * 3600_000).toISOString(); }
  else b.mood = moodFor(b, now, {});
  return { ok: true, action, levelUp, evolved, note, game, byteCell };
}

/** Time passing: hunger rises, energy recovers (faster while asleep), happiness drifts toward 50. */
export function decay(b: ByteState, now: Date) {
  const hours = Math.min(48, (now.getTime() - new Date(b.lastDecay).getTime()) / 3600_000);
  if (hours <= 0) return;
  const asleep = istHour(now) >= 23 || istHour(now) < 7;
  b.hunger = clamp(b.hunger + hours * 3);
  b.energy = clamp(b.energy + hours * (asleep ? 8 : 3));
  b.happiness = clamp(b.happiness + Math.sign(50 - b.happiness) * Math.min(Math.abs(50 - b.happiness), hours * 1.5));
  b.lastDecay = now.toISOString();
}

export interface Activity { lastPush?: string | null; commitsLast24h?: number; milestone?: boolean }
/** Pick the mood from the clock, Byte's needs and what the owner has been doing. First match wins. */
export function moodFor(b: ByteState, now: Date, a: Activity): Mood {
  if (a.milestone) return 'celebrating';
  if (b.moodUntil && new Date(b.moodUntil) > now && (b.mood === 'excited' || b.mood === 'celebrating')) return b.mood;
  const h = istHour(now);
  if (h >= 23 || h < 7) return 'sleeping';
  if ((a.commitsLast24h ?? 0) >= 15) return 'excited';
  const push = a.lastPush ?? b.lastPush;
  if (push && now.getTime() - new Date(push).getTime() < 3 * 3600_000) return 'coding';
  if (b.hunger >= 70) return 'hungry';
  if (b.energy <= 25 || h >= 22) return 'sleepy';
  if (b.happiness >= 75) return 'happy';
  return 'idle';
}
