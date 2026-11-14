import { readFileSync } from 'node:fs';
import opentype from 'opentype.js';
import type { Theme } from './theme.ts';

const dir = new URL('../fonts/', import.meta.url);
const b64 = (f: string) => readFileSync(new URL(f, dir)).toString('base64');
const face = (family: string, weight: number, file: string) => `@font-face{font-family:'${family}';font-weight:${weight};src:url(data:font/woff;base64,${b64(file)}) format('woff')}`;
const FACES = { r: face('Fredoka', 400, 'fredoka-400.woff'), b: face('Fredoka', 600, 'fredoka-600.woff'), m: face('JBMono', 500, 'mono-500.woff') };
const buf = (f: string) => { const b = readFileSync(new URL(f, dir)); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); };
const FONTS = { r: opentype.parse(buf('fredoka-400.woff')), b: opentype.parse(buf('fredoka-600.woff')), m: opentype.parse(buf('mono-500.woff')) };

/** Width of a string in px, measured from the same font file that gets embedded. */
export const measure = (text: string, size: number, font: keyof typeof FONTS = 'b') => FONTS[font].getAdvanceWidth(text, size);
export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export { EASE } from './ease.ts';

export interface DocOpts { w: number; h: number; t: Theme; title: string; body: string; css?: string; fonts?: (keyof typeof FACES)[]; frame?: boolean }
/** Wrap a section in a self-contained SVG: embedded fonts, shared text styles and a reduced-motion switch. */
export function doc({ w, h, t, title, body, css = '', fonts = ['r', 'b'], frame = true }: DocOpts) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title><style>${fonts.map((f) => FACES[f]).join('')}
text{font-family:'Fredoka','Trebuchet MS',sans-serif;fill:${t.ink}}.b{font-weight:600}.s{fill:${t.sub}}.m{font-family:'JBMono',ui-monospace,monospace;font-weight:500}.a{fill:${t.accentText}}
${css}
@media (prefers-reduced-motion: reduce){*{animation:none!important}}</style>${frame ? `<rect x="1.5" y="1.5" width="${w - 3}" height="${h - 3}" rx="22" fill="${t.card}" stroke="${t.line}" stroke-width="3"/>` : ''}${body}</svg>`;
}
/** Section heading used at the top-left of most cards. */
export const heading = (t: Theme, text: string, x = 28, y = 40) => `<text x="${x}" y="${y}" class="b" font-size="20">${esc(text)}</text><rect x="${x}" y="${y + 9}" width="34" height="4" rx="2" fill="${t.accent}"/>`;
