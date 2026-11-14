import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// Served from https://nithinkumaru777.github.io/Nithinkumaru777/ by .github/workflows/pages.yml.
export default defineConfig({
  base: '/Nithinkumaru777/',
  resolve: { alias: { '@byte': fileURLToPath(new URL('../scripts', import.meta.url)) } },
  server: { fs: { allow: ['..'] } },
  build: { target: 'es2022', cssCodeSplit: false, assetsInlineLimit: 0 },
});
