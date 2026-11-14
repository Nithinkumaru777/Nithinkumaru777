/** Everything personal lives here. See README_SETUP.md. */
export const config = {
  user: 'Nithinkumaru777',
  repo: 'Nithinkumaru777',
  name: 'Nithin Kumar U',
  location: 'Bengaluru, India',
  buddy: 'Byte',
  site: 'https://nithinkumaru777.github.io/Nithinkumaru777/',
  roles: ['I build websites', 'dashboards', 'AI tools', 'apps for real businesses'],
  about: {
    building: 'websites, dashboards, apps and AI tools for clients',
    learning: 'motion design and desktop engineering',
    askMeAbout: 'shipping a client project end to end',
  },
  /** Featured project cards (2 × 2). Stars and descriptions are refreshed from the API when a token is present. */
  projects: [
    { repo: 'saakh', title: 'Saakh', blurb: 'AI loan eligibility and risk assessment', chips: ['Python', 'AI', 'Web'], art: 'gauge' },
    { repo: 'meeting-action-log', title: 'Meeting Action Log', blurb: 'Decisions and action items from every meeting', chips: ['MongoDB', 'React', 'Node'], art: 'list' },
    { repo: 'NexusOptimize', title: 'Nexus Optimize & Mod', blurb: 'Game optimiser and mod manager for Windows', chips: ['Electron', 'Python', 'Desktop'], art: 'bars' },
    { repo: 'gitpulse-desktop', title: 'GitPulse Desktop', blurb: 'GitHub activity at a glance, on the desktop', chips: ['TypeScript', 'Desktop'], art: 'pulse' },
  ],
  stack: {
    Frontend: ['HTML', 'CSS', 'TypeScript', 'React', 'Astro', 'Tailwind', 'GSAP', 'Three.js'],
    Backend: ['Python', 'FastAPI', 'Node', 'SQLite', 'MongoDB'],
    AI: ['Claude Code', 'Antigravity', 'Prompting', 'Agents'],
    Tools: ['Git', 'Actions', 'Electron', 'VS Code', 'Figma'],
  },
  links: { github: 'https://github.com/Nithinkumaru777' } as Record<string, string>,
} as const;
export const repoUrl = `https://github.com/${config.user}/${config.repo}`;
export const issueUrl = (title: string, body = 'Just press "Create" (or "Submit new issue"). Byte replies in a few seconds.') =>
  `${repoUrl}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
