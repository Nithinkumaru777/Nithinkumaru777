/** Start Byte over: level 1, no friends, empty board. Keeps the stats cache. Usage: npm run reset */
import { rmSync } from 'node:fs';
import { generate } from './generate.ts';
import { fresh } from './lib/state.ts';
import { save } from './lib/store.ts';
const w = fresh(); save(w); rmSync('state/avatars.json', { force: true });
await generate(w);
console.log('Byte has been reset. Commit and push README.md, assets and state.');
