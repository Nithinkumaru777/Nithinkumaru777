import { config } from '@byte/config.ts';

export const projects = config.projects.map((p) => ({ ...p, url: `https://github.com/${config.user}/${p.repo}`, media: p.repo.toLowerCase() }));
export const stack = config.stack;

/** Newest first. Edit freely: this is the only place the timeline lives. */
export const timeline = [
  { title: 'Byte and this site', kind: 'Personal project', text: 'An animated GitHub profile with a robot that visitors pet, feed and play tic-tac-toe with through issues, plus this playground.' },
  { title: 'Motion Index', kind: 'Personal project', text: 'A reference library of 250+ web animations with live demos. It is where I copy motion from for client sites.' },
  { title: 'Saakh', kind: 'College project', text: 'AI loan eligibility and risk assessment: an applicant fills a form, the model explains its decision.' },
  { title: 'Meeting Action Log', kind: 'College project', text: 'A MERN app that turns meetings into decisions, owners and due dates, so nothing gets lost after the call.' },
  { title: 'Driver Mitra Taxi', kind: 'Client work', text: 'Booking website and fleet platform for a Bengaluru taxi business, built with Astro.' },
  { title: 'Nexus Optimize & Mod', kind: 'Personal project', text: 'A Windows desktop app with real-time telemetry, game tuning, mod bisecting and rollback snapshots.' },
  { title: 'Repurpose.AI', kind: 'Personal project', text: 'An AI content repurposing single-page app with a WebGL cursor that follows you around.' },
];

/** What Byte says in the chat box. Keyword lists are checked in order; the first match answers. */
export const answers: { keys: string[]; say: () => string }[] = [
  { keys: ['hi', 'hello', 'hey', 'namaste', 'yo'], say: () => 'Beep! Hello. I am Byte. Ask me what Nithin builds, or how to hire him.' },
  { keys: ['project', 'built', 'build', 'work', 'portfolio', 'made'], say: () => `Recent favourites: ${projects.map((p) => p.title).join(', ')}. Scroll down and hover a card to see it move.` },
  { keys: ['saakh', 'loan', 'finance'], say: () => 'Saakh checks loan eligibility and risk with AI, and explains the decision in plain words.' },
  { keys: ['meeting', 'action'], say: () => 'Meeting Action Log keeps every decision and who owns it. Built with MongoDB, React and Node.' },
  { keys: ['nexus', 'game', 'optimi', 'mod'], say: () => 'Nexus Optimize & Mod tunes games on Windows and manages mods, with snapshots to roll back.' },
  { keys: ['gitpulse', 'desktop'], say: () => 'GitPulse Desktop shows GitHub activity at a glance, right on the desktop.' },
  { keys: ['skill', 'stack', 'tech', 'language', 'react', 'python', 'typescript'], say: () => `Mostly ${stack.Frontend.slice(0, 4).join(', ')} up front and ${stack.Backend.slice(0, 3).join(', ')} behind it, with AI agents helping.` },
  { keys: ['hire', 'freelance', 'cost', 'price', 'quote', 'available', 'contact', 'email'], say: () => 'He is open to freelance work. Press "Write to me on GitHub" at the bottom and describe your project.' },
  { keys: ['where', 'location', 'city', 'bengaluru', 'bangalore', 'india'], say: () => 'Bengaluru, India. I fall asleep at 11 pm IST on the GitHub profile, so time zones matter to me.' },
  { keys: ['who', 'you', 'byte', 'robot'], say: () => 'I am Byte, a small robot Nithin drew in code. I level up when people are nice to me.' },
  { keys: ['level', 'xp', 'mood'], say: () => '' },     // filled from live state in chat.ts
  { keys: ['joke', 'funny'], say: () => 'Why did the robot go on holiday? It needed to recharge. ...I will see myself out.' },
  { keys: ['cookie', 'food', 'hungry', 'eat'], say: () => 'Cookies are in the jar on the floor. Drag one to me. Please. Now, ideally.' },
];
export const shrugs = ['Beep? I only know about Nithin, his projects and cookies.', 'That one is outside my memory banks. Try asking about projects or skills.', 'Hmm. Ask me what Nithin has built, or how to hire him.'];
