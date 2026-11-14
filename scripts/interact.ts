import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { config, repoUrl } from './config.ts';
import { generate } from './generate.ts';
import { cached } from './lib/github.ts';
import { parseTitle, type Action } from './lib/parse.ts';
import { reactionFor, replyFor } from './lib/replies.ts';
import { apply, type Outcome, type World } from './lib/state.ts';
import { load, save } from './lib/store.ts';

export interface Issue { number: number; title: string; user: string }
/** The three GitHub calls the handler needs. Tests and the dry run pass a fake. */
export interface Api { open(): Promise<Issue[]>; comment(n: number, body: string): Promise<void>; close(n: number): Promise<void> }
/** Everything that touches the disk or git. */
export interface Io { load(): World; commit(w: World, message: string, now: Date): Promise<void>; push(): Promise<void>; reactionUrl(id: string, mode: 'light' | 'dark'): string }
export interface Result { issue: Issue; action: Action | null; outcome: Outcome | null; message: string | null; comment: string }

const LABEL: Record<Action['kind'], (a: any) => string> = { pet: () => 'pet', feed: (a) => `feed ${a.food}`, play: () => 'play', dance: () => 'dance', say: () => 'say hi', accessory: (a) => `accessory ${a.item}`, ttt: (a) => `tic-tac-toe square ${a.cell + 1}` };
export const commitMessage = (a: Action, user: string) => `Byte: ${LABEL[a.kind](a)} by @${user}`;
const MAX_PER_RUN = 30;

/**
 * Handle every open "byte|…" issue, oldest first. GitHub keeps only one pending run per concurrency group,
 * so a single run drains the whole queue instead of trusting one run per issue.
 */
export async function processIssues(api: Api, io: Io, now: () => Date = () => new Date(), random: () => number = Math.random): Promise<Result[]> {
  const issues = (await api.open()).filter((i) => /^\s*byte\s*\|/i.test(i.title)).sort((a, b) => a.number - b.number).slice(0, MAX_PER_RUN);
  const w = io.load(), results: Result[] = [];
  for (const issue of issues) {
    const action = parseTitle(issue.title), at = now();
    if (!action) { results.push({ issue, action, outcome: null, message: null, comment: body(io, 'oops', replyFor({ ok: false, reason: 'unknown' as never }, issue.user, random), w) }); continue; }
    const outcome = apply(w, action, issue.user, at, random);
    let message: string | null = null;
    if (outcome.ok) { message = commitMessage(action, issue.user); await io.commit(w, message, at); }
    results.push({ issue, action, outcome, message, comment: body(io, reactionFor(outcome), replyFor(outcome, issue.user, random), w) });
  }
  if (results.some((r) => r.message)) await io.push();          // images in the replies must exist on main first
  for (const r of results) { await api.comment(r.issue.number, r.comment); await api.close(r.issue.number); }
  return results;
}

function body(io: Io, reactionId: string, text: string, w: World) {
  const b = w.byte;
  return `<picture><source media="(prefers-color-scheme: dark)" srcset="${io.reactionUrl(reactionId, 'dark')}"><img src="${io.reactionUrl(reactionId, 'light')}" width="240" alt="${config.buddy} reacts"></picture>

${text}

<sub>${b.name} is level ${b.level} with ${b.xp} XP. Happiness ${b.happiness}, energy ${b.energy}, hunger ${b.hunger}. <a href="https://github.com/${config.user}">Back to the profile</a></sub>`;
}

// ── real implementations ─────────────────────────────────────────────
const git = (...args: string[]) => execFileSync('git', args, { stdio: ['ignore', 'pipe', 'inherit'] }).toString();
export const realIo = (): Io => ({
  load: () => load(),
  async commit(w, message, at) {
    save(w);
    await generate(w, cached(), { updatedAt: at.toISOString() });
    git('add', '-A', 'README.md', 'assets', 'state');
    try { git('commit', '-m', message); } catch { /* nothing changed */ }
  },
  async push() {
    for (let i = 0; i < 4; i++) { try { git('push'); return; } catch { git('pull', '--rebase', '-X', 'theirs'); } }
    throw new Error('could not push');
  },
  reactionUrl(id, mode) {
    const path = `assets/react-${id}-${mode}.svg`;
    return `https://raw.githubusercontent.com/${config.user}/${config.repo}/main/${path}?v=${createHash('sha1').update(readFileSync(path)).digest('hex').slice(0, 8)}`;
  },
});
export function realApi(token: string, repo = `${config.user}/${config.repo}`): Api {
  const call = async (path: string, init: RequestInit = {}) => {
    const res = await fetch(`https://api.github.com/repos/${repo}${path}`, { ...init, headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'content-type': 'application/json', 'user-agent': 'byte-profile' } });
    if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path}: ${res.status} ${await res.text()}`);
    return res.json() as Promise<any>;
  };
  return {
    open: async () => ((await call('/issues?state=open&per_page=100&sort=created&direction=asc')) as any[]).filter((i) => !i.pull_request).map((i) => ({ number: i.number, title: i.title, user: i.user.login })),
    comment: async (n, text) => { await call(`/issues/${n}/comments`, { method: 'POST', body: JSON.stringify({ body: text }) }); },
    close: async (n) => { await call(`/issues/${n}`, { method: 'PATCH', body: JSON.stringify({ state: 'closed', state_reason: 'completed' }) }); },
  };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is required');
  const results = await processIssues(realApi(token, process.env.GITHUB_REPOSITORY), realIo());
  for (const r of results) console.log(`#${r.issue.number} ${r.issue.title} → ${r.message ?? (r.outcome && !r.outcome.ok ? r.outcome.reason : 'not understood')}`);
  if (!results.length) console.log('no open Byte issues');
  void repoUrl;
}
