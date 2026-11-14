import type { Actor } from './actor.ts';
import { answers, shrugs } from './data.ts';
import type { Live } from './live.ts';

/** Byte answers from a small set of lines and real facts about the projects. No network, no AI call. */
export function chat(form: HTMLFormElement, actor: Actor, live: () => Live | null) {
  let n = 0;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = form.elements.namedItem('ask') as HTMLInputElement, q = input.value.trim().toLowerCase();
    if (!q) { actor.talk('Type a question first. I am good, but not that good.'); return; }
    const words = q.split(/[^a-z0-9]+/);
    const hit = answers.find((a) => a.keys.some((k) => (k.length <= 3 ? words.includes(k) : q.includes(k))));
    let text = hit?.say() ?? shrugs[n++ % shrugs.length];
    if (hit?.keys.includes('level')) { const l = live(); text = l ? `On GitHub I am level ${l.level} with ${l.xp} XP and I feel ${l.mood}. ${l.pets.total} pets so far.` : 'My GitHub stats are not loading right now. Pet me there and check!'; }
    actor.talk(text); input.value = '';
  });
}
