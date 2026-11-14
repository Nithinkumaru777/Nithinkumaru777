import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { config } from '../config.ts';

export interface Stats {
  /** false until the first run with a token has replaced the placeholder numbers. */
  live: boolean; fetchedAt: string | null;
  stars: number; commitsYear: number; prs: number; issues: number; repos: number; followers: number;
  languages: { name: string; share: number }[];
  streak: { current: number; longest: number; alive: boolean };
  week: { day: string; count: number }[];
  commits24h: number; lastPush: string | null;
  /** Contribution counts for the last 53 weeks, oldest first, used by the snake card. */
  calendar: number[];
  projects: Record<string, { stars: number; description: string | null }>;
}
const CACHE = 'state/cache.json';
export const emptyStats = (): Stats => ({ live: false, fetchedAt: null, stars: 0, commitsYear: 0, prs: 0, issues: 0, repos: 0, followers: 0, languages: [], streak: { current: 0, longest: 0, alive: false }, week: [], commits24h: 0, lastPush: null, calendar: [], projects: {} });
export const cached = (): Stats => (existsSync(CACHE) ? { ...emptyStats(), ...JSON.parse(readFileSync(CACHE, 'utf8')) } : emptyStats());

const QUERY = `query($login:String!){user(login:$login){followers{totalCount}
 repositories(ownerAffiliations:OWNER,isFork:false,first:100,orderBy:{field:PUSHED_AT,direction:DESC}){totalCount nodes{name description stargazerCount pushedAt isPrivate languages(first:8,orderBy:{field:SIZE,direction:DESC}){edges{size node{name}}}}}
 pullRequests{totalCount} issues{totalCount}
 contributionsCollection{totalCommitContributions restrictedContributionsCount contributionCalendar{weeks{contributionDays{date contributionCount}}}}}}`;

/** Streak facts from a list of days, oldest first. Today counts as alive even before the first commit of the day. */
export function streakOf(days: { date: string; contributionCount: number }[]) {
  let longest = 0, run = 0;
  for (const d of days) { run = d.contributionCount > 0 ? run + 1 : 0; longest = Math.max(longest, run); }
  let current = 0, i = days.length - 1;
  if (i >= 0 && days[i].contributionCount === 0) i--;        // today may still be empty
  for (; i >= 0 && days[i].contributionCount > 0; i--) current++;
  return { current, longest, alive: current > 0 };
}

/** Fetch everything the stat cards need in one GraphQL call. Falls back to the cache when there is no token or the call fails. */
export async function fetchStats(token = process.env.GITHUB_TOKEN): Promise<Stats> {
  const old = cached();
  if (!token) return old;
  try {
    const res = await fetch('https://api.github.com/graphql', { method: 'POST', headers: { authorization: `bearer ${token}`, 'content-type': 'application/json', 'user-agent': 'byte-profile' }, body: JSON.stringify({ query: QUERY, variables: { login: config.user } }) });
    const json = (await res.json()) as any;
    const u = json?.data?.user;
    if (!u) throw new Error(JSON.stringify(json?.errors ?? json).slice(0, 300));
    const repos = u.repositories.nodes as any[];
    const sizes = new Map<string, number>();
    for (const r of repos) for (const e of r.languages.edges) sizes.set(e.node.name, (sizes.get(e.node.name) ?? 0) + e.size);
    const total = [...sizes.values()].reduce((a, b) => a + b, 0) || 1;
    const top = [...sizes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, size]) => ({ name, share: size / total }));
    const days = u.contributionsCollection.contributionCalendar.weeks.flatMap((w: any) => w.contributionDays) as { date: string; contributionCount: number }[];
    // The profile repo is pushed to by Byte's own workflows, so it does not count as the owner coding.
    const lastPush = repos.filter((r) => r.name !== config.repo).map((r) => r.pushedAt).sort().pop() ?? null;
    const stats: Stats = {
      live: true, fetchedAt: new Date().toISOString(),
      stars: repos.reduce((n, r) => n + r.stargazerCount, 0),
      commitsYear: u.contributionsCollection.totalCommitContributions + u.contributionsCollection.restrictedContributionsCount,
      prs: u.pullRequests.totalCount, issues: u.issues.totalCount, repos: u.repositories.totalCount, followers: u.followers.totalCount,
      languages: top, streak: streakOf(days), week: days.slice(-7).map((d) => ({ day: d.date, count: d.contributionCount })),
      commits24h: days.slice(-1)[0]?.contributionCount ?? 0, lastPush, calendar: days.slice(-371).map((d) => d.contributionCount),
      projects: Object.fromEntries(config.projects.map((p) => { const r = repos.find((x) => x.name.toLowerCase() === p.repo.toLowerCase()); return [p.repo, { stars: r?.stargazerCount ?? old.projects[p.repo]?.stars ?? 0, description: r?.description ?? null }]; })),
    };
    return stats;
  } catch (e) {
    console.warn('stats: using cache —', (e as Error).message);
    return old;
  }
}

export const saveStats = (s: Stats) => writeFileSync(CACHE, JSON.stringify(s, null, 2) + '\n');
