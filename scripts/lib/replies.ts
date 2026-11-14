import type { Outcome } from './state.ts';

/** Byte's voice: short, warm, a little nerdy. {user} and {n} are filled in. 40+ lines so replies rarely repeat. */
const LINES: Record<string, string[]> = {
  pet: ['Beep! That is the good spot, @{user}.', 'Happiness module: overflowing. Thank you, @{user}!', '*wiggles antenna* More of that, please, @{user}.', 'Pet received and filed under "best things today". Thanks, @{user}.', 'My fans just spun up a little. That was nice, @{user}.', 'Warm circuits! You are officially a friend, @{user}.'],
  feed: ['Nom nom. One {food}, perfectly compiled. Thanks, @{user}!', 'Crunch detected. Hunger going down. You are a hero, @{user}.', 'A {food}! My favourite data type. Thank you, @{user}.', 'Tummy.exe has stopped rumbling. Cheers, @{user}!', 'I saved a crumb for later. Do not tell anyone, @{user}.', 'That {food} was 10 out of 10. Would eat again, @{user}.'],
  play: ['Catch! ...I missed. Again! Again, @{user}!', 'That was fun! I gained XP and lost a little breath, @{user}.', 'Boing boing boing. Best game ever, @{user}.', 'You throw, I chase, everybody wins. Thanks, @{user}!', 'Play session logged. Energy spent wisely, @{user}.', 'I did a tiny flip. Did you see it, @{user}?'],
  dance: ['*does the robot, obviously* Thanks for the beat, @{user}!', 'Left foot, right foot, antenna wiggle. Dance complete, @{user}.', 'My dance moves are 100% original. Mostly. Thanks, @{user}!', 'Shuffling at 120 beats per minute for you, @{user}.', 'Spin, hop, beep! That was my best one yet, @{user}.'],
  say: ['Message received and pinned to my guestbook. Hi, @{user}!', 'I read it twice because it made me happy. Thanks, @{user}.', 'Noted in my memory banks, @{user}. Hello back!', 'Beep boop, that means "thank you for writing", @{user}.', 'Your words are now on the wall. Nithin will see them too, @{user}.'],
  accessory_unlocked: ['New look unlocked: the {item}! How do I look, @{user}?', 'A {item}! Fancy. Wearing it right away, @{user}.', 'I feel 30% cooler with this {item}. Thanks, @{user}!'],
  accessory_on: ['{item} on. Looking sharp, @{user}.', 'Back in the {item}. Good choice, @{user}.'],
  accessory_off: ['{item} off for now. I will keep it safe, @{user}.', 'Putting the {item} away. Thanks, @{user}.'],
  ttt_move: ['Hmm. I go here. Your turn, @{user}!', 'Good move, @{user}. I have answered with a small O.', 'Beep. My O is placed. What will you do, @{user}?', 'I thought about that for 0.002 seconds. Your move, @{user}.'],
  ttt_win: ['You won, @{user}! I am not even mad. Okay, a tiny bit.', 'Three in a row! Well played, @{user}. New board is ready.', 'Defeated by @{user}. I will practise. Rematch?'],
  ttt_lose: ['Three O in a row! I win this one, @{user}. Rematch?', 'Victory beep! Good game, @{user}. Board cleared for the next round.', 'I got lucky, @{user}. Try me again!'],
  ttt_draw: ['A draw! We are evenly matched, @{user}.', 'No winner this time, @{user}. Fresh board is up.'],
  levelup: ['LEVEL UP! I am now level {n}. Confetti everywhere!', 'Ding! Level {n} reached. Thank you for helping me grow.', 'New level: {n}. I can feel my antenna getting stronger.'],
  evolved: ['Something is changing... I evolved! Go look at my new look on the profile.', 'Evolution complete. I have a new upgrade to show off!'],
  cooldown: ['Easy there, @{user}! I need {n} more seconds to catch my breath.', 'One thing at a time, @{user}. Try again in {n} seconds.'],
  'user-cap': ['You have been so kind today, @{user}, that I hit my daily limit for one friend. See you tomorrow!'],
  'day-cap': ['What a busy day! I am all played out, @{user}. Come back tomorrow.'],
  filtered: ['I could not put that one on the wall, @{user}. Messages need to be friendly and link-free.'],
  taken: ['That square is already taken, @{user}. Pick an empty one on the board.'],
  tired: ['I am too sleepy for that right now, @{user}. A snack or a nap would help.'],
  unknown: ['Beep? I did not understand that one, @{user}. Use the buttons on the profile and I will know what to do.'],
};
export const REPLY_COUNT = Object.values(LINES).reduce((n, l) => n + l.length, 0);
const pick = (key: string, random: () => number) => { const l = LINES[key] ?? LINES.unknown; return l[Math.floor(random() * l.length)]; };
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''));

/** Which reaction image goes with an outcome. */
export function reactionFor(o: Outcome): string {
  if (!o.ok) return o.reason === 'tired' ? 'sleepy' : 'oops';
  if (o.levelUp) return 'levelup';
  const a = o.action;
  return a.kind === 'ttt' ? (o.game === 'win' ? 'oops' : o.game === 'lose' ? 'levelup' : 'think') : a.kind === 'accessory' ? 'hat' : a.kind;
}
export function replyFor(o: Outcome, user: string, random: () => number = Math.random): string {
  if (!o.ok) return fill(pick(o.reason, random), { user, n: o.waitSec ?? 0 });
  const a = o.action, v: Record<string, string | number> = { user };
  let key: string = a.kind;
  if (a.kind === 'feed') v.food = a.food;
  if (a.kind === 'accessory') { key = `accessory_${o.note}`; v.item = a.item; }
  if (a.kind === 'ttt') key = `ttt_${o.game}`;
  const out = [fill(pick(key, random), v)];
  if (o.levelUp) out.push(fill(pick('levelup', random), { n: o.levelUp }));
  if (o.evolved) out.push(pick('evolved', random));
  return out.join('\n\n');
}
