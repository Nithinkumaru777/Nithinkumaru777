import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fresh, type World } from './state.ts';

const read = <T>(file: string, fallback: T): T => (existsSync(file) ? { ...fallback, ...JSON.parse(readFileSync(file, 'utf8')) } : fallback);
export function load(dir = 'state'): World {
  const f = fresh();
  return { byte: read(`${dir}/byte.json`, f.byte), friends: read(`${dir}/friends.json`, f.friends), game: read(`${dir}/game.json`, f.game) };
}
export function save(w: World, dir = 'state') {
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/byte.json`, JSON.stringify(w.byte, null, 2) + '\n');
  writeFileSync(`${dir}/friends.json`, JSON.stringify(w.friends, null, 2) + '\n');
  writeFileSync(`${dir}/game.json`, JSON.stringify(w.game, null, 2) + '\n');
}
