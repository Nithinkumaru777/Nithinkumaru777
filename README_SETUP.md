# How this profile works

Everything you see on the profile is an SVG drawn by the scripts in this repo. The animation is plain CSS `@keyframes` inside each SVG, so it plays inside GitHub's image proxy with no JavaScript. The fonts are embedded in each file, there are no outside requests, and each file stays well under 500 KB. Every SVG comes in a light and a dark version, and the README picks one with `<picture>` and `prefers-color-scheme`.

```
README.md               generated, do not edit by hand
templates/README.tpl.md the layout of the README; {{placeholders}} become pictures
scripts/config.ts       your name, roles, projects, stack and links
scripts/gen/*.ts        one generator per section (hero, Byte card, stats, snake, ...)
scripts/lib/byte.ts     the one function that draws Byte, in any mood, look and stage
scripts/lib/state.ts    Byte's rules: needs, moods, XP, cooldowns, tic-tac-toe
scripts/interact.ts     handles "byte|..." issues
scripts/update.ts       the 3-hourly refresh
state/*.json            Byte's memory: byte.json, friends.json, game.json
assets/*.svg            the pictures the README shows
site/                   the companion site (Vite + TypeScript + GSAP)
```

## Turn it on (once)

1. **Pages:** Settings → Pages → Build and deployment → Source: **GitHub Actions**. The "Deploy site" workflow then publishes `site/` to https://nithinkumaru777.github.io/Nithinkumaru777/.
2. **Workflow permissions:** Settings → Actions → General → Workflow permissions. Either setting works, because each workflow asks for what it needs, but if your account forces read-only tokens, switch to **Read and write permissions**.
3. **Issues** must stay enabled. That is how visitors talk to Byte.
4. Run **Update Byte** once from the Actions tab (or just wait for the next push). The first run with a token replaces the placeholder zeros on the stat cards with your real numbers. Run **Contribution snake** once too, so the snake card uses your real contribution graph.

## How visitors play

Each button under Byte opens a new issue with a pre-filled title. When the issue is created, `interact.yml` runs:

| Issue title | What happens |
|---|---|
| `byte\|pet` | happiness up, counts towards "pets today" |
| `byte\|feed\|cookie` (or `dosa`, `chai`) | hunger down, a little energy back |
| `byte\|play` | uses energy, makes Byte hungrier and happier |
| `byte\|dance` | Byte gets excited for a few hours |
| `byte\|say\|<message>` | the message goes in the guestbook (80 characters, no links or rude words) |
| `byte\|accessory\|hat` (or `shades`, `bow`) | unlocks it and puts it on; sending it again takes it off |
| `byte\|ttt\|<0-8>` | plays an X on that square; Byte answers with an O |

The job updates `state/`, redraws the pictures, commits `Byte: <action> by @<user>`, replies in character with a small animated reaction, and closes the issue. Only one job runs at a time and each job handles every waiting issue, so nothing is lost when many people press buttons at once. Each visitor can act once a minute and 25 times a day; Byte takes 400 actions a day in total. XP raises Byte's level from 1 to 20. At level 5 he grows a second antenna, at 10 a chest light, at 20 a cape.

Issues whose title does not start with `byte|` are left alone, so the "Write to me on GitHub" button on the site stays a normal issue for you to read.

Every 3 hours `update.yml` lets time pass (hunger rises, energy recovers, faster at night), picks the mood from the clock in IST and from your activity (asleep 23:00–07:00, coding if you pushed to another repo in the last 3 hours, excited after a big day, celebrating when your stars pass 1, 5, 10, 25, 50, 100, ...), refreshes the stats, and commits only if a picture actually changed.

## Common changes

**Change your name, roles, about text, links:** edit `scripts/config.ts`, then run `npm run generate` and commit.

**Change colours:** edit `scripts/lib/theme.ts`. Keep one accent colour; `accentText` is the darker version used for text so it stays readable. The site uses the same values in `site/src/style.css` (`:root` and the dark block).

**Add or swap a project card:** add an entry to `projects` in `scripts/config.ts`:

```ts
{ repo: 'my-repo', title: 'My Project', blurb: 'One line about what it does', chips: ['React', 'Node'], art: 'bars' },
```

`art` picks the little looping picture: `gauge`, `list`, `bars` or `pulse`. The README shows the cards two per row, so keep an even number. For the site's hover video run `npx tsx scripts/site-media.ts` after changing projects.

**Change the README layout:** move or delete `{{blocks}}` in `templates/README.tpl.md`.

**Change the site's timeline or Byte's chat answers:** `site/src/data.ts`.

**Reset Byte to level 1 with no friends:** `npm run reset`, then commit and push.

## Run it locally

```bash
npm ci
npm run generate          # redraw README.md and assets/ from state/
npm test                  # unit tests + SVG checks (valid XML, size, no scripts or outside links)
npm run dry-run           # runs the issue handler on fake issues of every kind, in a temp folder
npm run previews -- --demo   # PNG + GIF of every section, light and dark, plus animation/clipping checks (needs Chrome)
cd site && npm ci && npm run dev
```

`previews/` is ignored by git; it is for looking, not for committing.

## Notes

- GitHub caches README images. Every picture URL ends in `?v=<hash of the file>`, so a changed picture gets a new URL and shows up straight away.
- Stats come from the GitHub GraphQL API with the workflow's own token. No third-party stat services. If a call fails, the last good numbers in `state/cache.json` are used.
- Everything moves less for people who ask their system for reduced motion, in the SVGs and on the site.
