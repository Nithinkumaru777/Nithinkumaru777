import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// Served from https://nithinkumaru777.github.io/Nithinkumaru777/ by .github/workflows/pages.yml.
const base = '/Nithinkumaru777/';
export default defineConfig({
  base,
  resolve: { alias: { '@byte': fileURLToPath(new URL('../scripts', import.meta.url)) } },
  server: { fs: { allow: ['..'] } },
  build: { target: 'es2022', cssCodeSplit: false, assetsInlineLimit: 0 },
  // Preload the hashed Fredoka files so they arrive before first layout instead of forcing a second full relayout on swap.
  plugins: [{ name: 'preload-fonts', apply: 'build', transformIndexHtml: { order: 'post', handler: (html, { bundle }) => ({ html, tags: Object.keys(bundle ?? {}).filter((f) => f.endsWith('.woff2')).map((f) => ({ tag: 'link', attrs: { rel: 'preload', href: base + f, as: 'font', type: 'font/woff2', crossorigin: '' }, injectTo: 'head' as const })) }) } }],
});
