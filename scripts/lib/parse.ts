export type Action =
  | { kind: 'pet' } | { kind: 'feed'; food: string } | { kind: 'play' } | { kind: 'dance' }
  | { kind: 'say'; message: string } | { kind: 'accessory'; item: string } | { kind: 'ttt'; cell: number };
export const ACCESSORIES = ['hat', 'shades', 'bow'] as const;
export const FOODS = ['cookie', 'dosa', 'chai'] as const;

/** Parse an issue title such as "byte|feed|cookie". Returns null for anything that is not a Byte command. */
export function parseTitle(title: string): Action | null {
  const parts = title.trim().split('|').map((s) => s.trim());
  if (parts[0]?.toLowerCase() !== 'byte') return null;
  const [, cmd = '', ...rest] = parts;
  const arg = rest.join('|').trim();
  switch (cmd.toLowerCase()) {
    case 'pet': return { kind: 'pet' };
    case 'feed': return { kind: 'feed', food: (FOODS as readonly string[]).includes(arg.toLowerCase()) ? arg.toLowerCase() : 'cookie' };
    case 'play': return { kind: 'play' };
    case 'dance': return { kind: 'dance' };
    case 'say': return arg ? { kind: 'say', message: arg } : null;
    case 'accessory': return (ACCESSORIES as readonly string[]).includes(arg.toLowerCase()) ? { kind: 'accessory', item: arg.toLowerCase() } : null;
    case 'ttt': return /^[0-8]$/.test(arg) ? { kind: 'ttt', cell: Number(arg) } : null;
    default: return null;
  }
}
