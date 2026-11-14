import { config } from '../config.ts';
import { byte, stageFor } from '../lib/byte.ts';
import { doc, EASE, esc, heading, measure } from '../lib/svg.ts';
import type { Theme } from '../lib/theme.ts';
import type { World } from '../lib/state.ts';
import { winner } from '../lib/ttt.ts';

const VERB: Record<string, string> = { pet: 'petted Byte', feed: 'fed Byte', play: 'played', dance: 'danced', say: 'said hi', accessory: 'dressed Byte', ttt: 'played a move' };
const clip = (s: string, size: number, max: number, font: 'r' | 'b' | 'm' = 'b') => { let o = s; while (o.length > 1 && measure(o, size, font) > max) o = o.slice(0, -1); return o === s ? s : o.slice(0, -1) + '…'; };

/** Last 12 visitors as a row of avatars, plus the five who have interacted most. `avatars` maps login → PNG data URI. */
export function friends(t: Theme, w: World, avatars: Record<string, string>) {
  const W = 1200, H = 330, recent = w.friends.recent.slice(0, 12), top = Object.entries(w.friends.counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 5);
  let body = heading(t, "Byte's friends"), css = `.av{transform-box:fill-box;transform-origin:center;animation:av .7s ${EASE.spring} both}@keyframes av{from{transform:scale(0)}}
.bob{animation:bob 3.4s ${EASE.io} infinite alternate}@keyframes bob{from{transform:translateY(-3px)}to{transform:translateY(3px)}}.barf{transform-origin:0 0;animation:barf 1s ${EASE.expo} both}@keyframes barf{from{transform:scaleX(0)}}`;
  if (!recent.length) {
    const b = byte({ t, mood: 'idle', stage: stageFor(w.byte.level), wearing: w.byte.accessories.wearing, wave: true, x: 170, y: 262, scale: 1.25 });
    css += b.css;
    body += `${b.svg}<text x="300" y="150" font-size="34" class="b">No friends yet. Be the first.</text><text x="300" y="188" font-size="19" class="s">Press any button under Byte and your avatar shows up here,</text><text x="300" y="214" font-size="19" class="s">usually within a minute.</text>`
      + Array.from({ length: 6 }, (_, i) => `<g class="bob" style="animation-delay:-${i * 0.5}s"><circle cx="${330 + i * 78}" cy="270" r="26" fill="none" stroke="${t.line}" stroke-width="3" stroke-dasharray="5 8" stroke-linecap="round"/></g>`).join('');
    return doc({ w: W, h: H, t, title: "Byte's friends: nobody yet. Press a button under Byte to be the first.", body, css });
  }
  body += `<text x="28" y="84" font-size="15" class="s">Latest visitors</text><text x="748" y="84" font-size="15" class="s">Top friends</text><defs><clipPath id="round"><circle cx="0" cy="0" r="30"/></clipPath></defs>`;
  recent.forEach((r, i) => {
    const x = 62 + (i % 6) * 112, y = 136 + Math.floor(i / 6) * 108, img = avatars[r.user];
    body += `<g transform="translate(${x},${y})"><g class="bob" style="animation-delay:-${(i * 0.41).toFixed(2)}s"><g class="av" style="animation-delay:${(0.1 + i * 0.07).toFixed(2)}s"><circle r="33" fill="${t.accent}"/>${img ? `<image href="${img}" x="-30" y="-30" width="60" height="60" clip-path="url(#round)"/>` : `<circle r="30" fill="${t.shell}"/><text y="10" text-anchor="middle" font-size="28" class="b" style="fill:#2B2017">${esc(r.user[0].toUpperCase())}</text>`}<circle r="31.500" fill="none" stroke="${t.ink}" stroke-width="3"/></g></g>
<text y="52" text-anchor="middle" font-size="13" class="b">${esc(clip(r.user, 13, 100))}</text><text y="68" text-anchor="middle" font-size="12" class="s">${VERB[r.action] ?? 'visited'}</text></g>`;
  });
  const max = top[0]?.[1] ?? 1;
  top.forEach(([user, n], i) => {
    const y = 104 + i * 42;
    body += `<g transform="translate(748,${y})"><text x="0" y="22" font-size="17" class="b a">${i + 1}</text><text x="26" y="22" font-size="17" class="b">${esc(clip(user, 17, 150))}</text><rect x="190" y="8" width="180" height="16" rx="8" fill="${t.line}"/><g transform="translate(190,8)"><rect class="barf" style="animation-delay:${(0.3 + i * 0.1).toFixed(2)}s" width="${Math.max(16, (n / max) * 180).toFixed(0)}" height="16" rx="8" fill="${i === 0 ? t.accent : t.shade}"/></g><text x="424" y="22" text-anchor="end" font-size="15" class="m s">${n}</text></g>`;
  });
  return doc({ w: W, h: H, t, title: `Byte's friends. Latest visitors: ${recent.map((r) => r.user).join(', ')}. Top friends: ${top.map(([u, n]) => `${u} (${n})`).join(', ')}.`, body, css, fonts: ['r', 'b', 'm'] });
}

/** The five newest guestbook messages as speech bubbles. */
export function guestbook(t: Theme, w: World) {
  const W = 1200, msgs = w.byte.guestbook.slice(0, 5), H = 96 + Math.max(1, Math.ceil(Math.max(msgs.length, 1) / 1)) * 0 + (msgs.length ? msgs.length * 62 : 124);
  let body = heading(t, 'Guestbook'), css = `.bub{animation:bub .8s ${EASE.spring} both}@keyframes bub{from{transform:translateY(18px) scale(.9);opacity:0}}.dot{animation:dot 1.4s ${EASE.io} infinite}@keyframes dot{0%,60%,100%{transform:none}30%{transform:translateY(-6px)}}`;
  if (!msgs.length) {
    body += `<g transform="translate(64,96)"><rect width="420" height="92" rx="28" fill="${t.bg}" stroke="${t.ink}" stroke-width="3"/><path d="M36,90 l-8,24 l30,-24Z" fill="${t.bg}" stroke="${t.ink}" stroke-width="3" stroke-linejoin="round"/><rect x="30" y="80" width="34" height="9" fill="${t.bg}"/>
${[0, 1, 2].map((i) => `<circle class="dot" style="animation-delay:${i * 0.18}s" cx="${40 + i * 24}" cy="46" r="7" fill="${t.accent}"/>`).join('')}<text x="126" y="42" font-size="20" class="b">Nobody has written yet.</text><text x="126" y="66" font-size="16" class="s">Use "Say hi" under Byte to leave a note.</text></g>`;
    return doc({ w: W, h: H + 20, t, title: 'Guestbook: no messages yet. Use Say hi to leave one.', body, css });
  }
  msgs.forEach((m, i) => {
    const y = 72 + i * 62, left = i % 2 === 0, tw = measure(m.text, 19, 'r'), uw = measure('@' + m.user, 14, 'b'), bw = Math.min(W - 180, Math.max(tw, uw) + 52), x = left ? 44 : W - 44 - bw;
    body += `<g class="bub" style="animation-delay:${(0.1 + i * 0.14).toFixed(2)}s;transform-origin:${left ? x : x + bw}px ${y + 50}px"><rect x="${x}" y="${y}" width="${bw}" height="50" rx="22" fill="${left ? t.bg : t.mode === 'light' ? t.shell : t.card}" stroke="${t.ink}" stroke-width="3"/>
<text x="${x + 24}" y="${y + 21}" font-size="13" class="b a">@${esc(m.user)}</text><text x="${x + 24}" y="${y + 40}" font-size="18">${esc(clip(m.text, 18, bw - 44, 'r'))}</text></g>`;
  });
  return doc({ w: W, h: H, t, title: `Guestbook. ${msgs.map((m) => `${m.user} says: ${m.text}`).join(' ')}`, body, css });
}

/** One tic-tac-toe square. Each square is its own image so it can carry its own link. */
export function tttCell(t: Theme, w: World, i: number) {
  const S = 132, g = w.game, v = g.board[i], over = winner(g.board), hot = over?.line.includes(i) ?? false, stale = !!over || g.board.every(Boolean);
  const st = `fill="none" stroke-width="13" stroke-linecap="round"`;
  const mark = v === 'X' ? `<path class="dr" d="M40,40 L92,92" ${st} stroke="${t.ink}" pathLength="10" stroke-dasharray="10"/><path class="dr d2" d="M92,40 L40,92" ${st} stroke="${t.ink}" pathLength="10" stroke-dasharray="10"/>`
    : v === 'O' ? `<circle class="dr" cx="66" cy="66" r="28" ${st} stroke="${t.accent}" pathLength="10" stroke-dasharray="10" transform="rotate(-90 66 66)"/>`
    : `<g class="hint"><circle cx="66" cy="66" r="7" fill="${t.line}"/></g>`;
  const css = `.dr{animation:dr .5s ${EASE.out} both}.d2{animation-delay:.22s}@keyframes dr{from{stroke-dashoffset:10}to{stroke-dashoffset:0}}
.hint{transform-box:fill-box;transform-origin:center;animation:hint 2.4s ${EASE.io} ${(i * 0.21).toFixed(2)}s infinite}@keyframes hint{0%,100%{transform:scale(.7);opacity:.6}50%{transform:scale(1.5);opacity:1}}
.hot{animation:hot 1s ${EASE.io} infinite alternate}@keyframes hot{from{opacity:.25}to{opacity:.9}}.cell{transform-box:fill-box;transform-origin:center;${hot ? `animation:win 1s ${EASE.io} infinite alternate` : ''}}@keyframes win{from{transform:scale(.94)}to{transform:scale(1)}}`;
  const body = `<g class="cell"><rect x="5" y="5" width="${S - 10}" height="${S - 10}" rx="24" fill="${t.card}" stroke="${stale && !hot ? t.line : t.ink}" stroke-width="4"/>${hot ? `<rect class="hot" x="5" y="5" width="${S - 10}" height="${S - 10}" rx="24" fill="${t.soft}"/>` : ''}${mark}</g>`;
  return doc({ w: S, h: S, t, title: v ? `Square ${i + 1}: ${v === 'X' ? 'X (visitors)' : 'O (Byte)'}` : `Square ${i + 1}: empty. Open an issue to play X here.`, body, css, fonts: [], frame: false });
}

export function tttStatus(t: Theme, w: World) {
  const W = 560, H = 396, g = w.game, over = winner(g.board), draw = !over && g.board.every(Boolean);
  const mood = over ? (over.who === 'O' ? 'celebrating' : 'sleepy') : draw ? 'idle' : 'happy';
  const b = byte({ t, mood, stage: stageFor(w.byte.level), wearing: w.byte.accessories.wearing, x: 104, y: 200, scale: 1.05 });
  const line = over ? (over.who === 'O' ? 'Byte wins this one.' : `@${g.last.by ?? 'A friend'} beat Byte!`) : draw ? "It's a draw." : g.board.some(Boolean) ? 'Your move. You are X.' : 'New game. You are X.';
  const sub = over || draw ? 'Press any square to start a new game.' : 'Press an empty square to place an X.';
  const score: [string, number][] = [['Friends', g.score.friends], ['Byte', g.score.byte], ['Draws', g.score.draws]];
  const css = `${b.css}.sc{transform-box:fill-box;transform-origin:center;animation:sc .7s ${EASE.spring} both}@keyframes sc{from{transform:scale(0)}}`;
  const body = `${heading(t, 'Tic-tac-toe with Byte')}${b.svg}
<text x="206" y="118" font-size="25" class="b">${esc(clip(line, 25, 330))}</text><text x="206" y="148" font-size="16" class="s">${sub}</text><text x="206" y="176" font-size="14" class="m s">${g.moves} moves played so far</text>
${score.map(([label, n], i) => `<g transform="translate(${28 + i * 172},250)"><g class="sc" style="animation-delay:${0.2 + i * 0.1}s"><rect width="160" height="112" rx="20" fill="${i === 1 ? t.soft : t.bg}" stroke="${t.ink}" stroke-width="3"/><text x="80" y="62" text-anchor="middle" font-size="44" class="b">${n}</text><text x="80" y="90" text-anchor="middle" font-size="15" class="s">${label}</text></g></g>`).join('')}`;
  return doc({ w: W, h: H, t, title: `Tic-tac-toe with Byte. ${line} Score: friends ${g.score.friends}, Byte ${g.score.byte}, draws ${g.score.draws}.`, body, css, fonts: ['r', 'b', 'm'] });
}
