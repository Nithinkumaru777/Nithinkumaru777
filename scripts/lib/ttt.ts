export type Cell = 'X' | 'O' | null;      // visitors are X, Byte is O
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
export const winner = (b: Cell[]): { who: 'X' | 'O'; line: number[] } | null => {
  for (const l of LINES) if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[0]] === b[l[2]]) return { who: b[l[0]]!, line: l };
  return null;
};
export const full = (b: Cell[]) => b.every(Boolean);

function minimax(b: Cell[], byteTurn: boolean, depth: number): number {
  const w = winner(b);
  if (w) return w.who === 'O' ? 10 - depth : depth - 10;
  if (full(b)) return 0;
  let best = byteTurn ? -Infinity : Infinity;
  for (let i = 0; i < 9; i++) {
    if (b[i]) continue;
    b[i] = byteTurn ? 'O' : 'X';
    const score = minimax(b, !byteTurn, depth + 1);
    b[i] = null;
    best = byteTurn ? Math.max(best, score) : Math.min(best, score);
  }
  return best;
}
/** Byte's reply. `slip` (0–1) is the chance of a random move, so Byte can be beaten now and then. */
export function byteMove(board: Cell[], slip = 0, random: () => number = Math.random): number {
  const free = board.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
  if (!free.length) return -1;
  if (slip > 0 && random() < slip) return free[Math.floor(random() * free.length)];
  let best = -Infinity, pick = free[0];
  for (const i of free) {
    const b = [...board]; b[i] = 'O';
    const score = minimax(b, false, 0);
    if (score > best) { best = score; pick = i; }
  }
  return pick;
}
