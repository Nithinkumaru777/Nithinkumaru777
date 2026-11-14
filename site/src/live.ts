import { config } from '@byte/config.ts';

export interface Live { level: number; mood: string; xp: number; happiness: number; pets: { total: number; today: number }; accessories: { wearing: string | null } }
/** Byte's real state, straight from the profile repo. The site works the same without it. */
export async function fetchLive(): Promise<Live | null> {
  try {
    const res = await fetch(`https://raw.githubusercontent.com/${config.user}/${config.repo}/main/state/byte.json`, { cache: 'no-store', signal: AbortSignal.timeout(6000) });
    return res.ok ? ((await res.json()) as Live) : null;
  } catch { return null; }
}
