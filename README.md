# testingcharlie.co.uk

Personal site for **Charlie** — senior test engineer, automation & DevOps. A
single-page portfolio in the *editorial-studio-meets-CI-dashboard* style:
confident display type with a test-engineer flavour (a live CI/CD pipeline
strip, a `git log` panel, a GitHub contribution grid, coverage/flake stats and
passing badges). Ships with a light/dark theme toggle.

Built with plain HTML, CSS and TypeScript — no framework, no bundler. The
TypeScript compiles with `tsc` to `dist/` and the page renders itself from a
typed data model in the browser.

## Structure

```
index.html              Page shell: fonts, anti-FOUC theme boot, #app mount
styles/tokens.css       Design tokens (light + dark) as CSS custom properties
styles/style.css        Component styles (consume tokens only)
src/
  types.ts              All domain interfaces (the compile-time contract)
  config.ts             Hand-authored content + settings  ← edit this
  seed.ts               Fallback/first-paint data for the live panels
  dom.ts                Typed element helpers (el, linkTo, multiline…)
  time.ts               relativeTime() for git-log timestamps
  theme.ts              ThemeController (localStorage + prefers-color-scheme)
  github/
    api-types.ts        Narrow shapes of the GitHub REST responses
    client.ts           GitHubClient — injectable fetch, no token required
    mappers.ts          Pure API→domain mappers (commits, heat levels)
  data-source.ts        LiveDataSource — live GitHub with seed fallback
  sections/             One render module per section (nav, hero, pipeline,
                        marquee, featured, git-log, github-panel, activity,
                        work, writing, footer, chrome)
  app.ts                renderPage + mountApp (composition + hydration)
  main.ts               Entry point: builds real deps, calls mountApp
tests/
  unit/                 Vitest (jsdom) — render fns, theme, client, mappers
  e2e/                  Playwright — theme, hydration, responsive, a11y
```

Each render function is pure — it takes typed data and returns a detached
`HTMLElement`, which makes the whole UI unit-testable in jsdom. `main.ts` is the
only module that reaches for real browser globals.

## Data & the live GitHub API

The recent-activity section is **progressively enhanced**:

1. The page renders instantly from typed **seed data** (`src/seed.ts`), so it is
   never blank and looks complete offline.
2. `LiveDataSource` then hydrates in the background via `GitHubClient`:
   - **recent commits** ← `GET /users/{user}/events/public` (public, no token)
   - **repo count** ← `GET /users/{user}` (public, no token)
3. Any failure (offline, rate-limited) is swallowed and the seed render stays.

> The GitHub **contribution calendar** requires an authenticated GraphQL call,
> which a static, backend-less site can't make safely, so the heat grid uses the
> seed pattern. `GitHubClient` is injectable, so wiring a token-backed proxy
> later is a drop-in change.

## Getting started

```bash
npm install          # install dev dependencies
npm run build        # compile TypeScript → dist/
npm run serve        # serve the static site locally
# or, in one step:
npm run dev          # build + serve
```

While working, `npm run watch` recompiles on save.

## Testing

```bash
npm run typecheck    # tsc for src (build config) and tests (test config)
npm test             # Vitest unit tests
npm run coverage     # Vitest with coverage (95% line/branch/fn/stmt gate)
npm run test:e2e     # Playwright end-to-end (desktop + mobile)
npm run check        # typecheck + coverage + build, all in one
```

First-time Playwright setup needs a browser: `npx playwright install chromium`.

## Theming

Colours are entirely driven by CSS custom properties defined in
`styles/tokens.css`. `ThemeController` sets `data-theme="light|dark"` on
`<html>`, initialising from `localStorage` then the OS `prefers-color-scheme`,
and persists the user's choice. A tiny inline script in `index.html` applies the
saved theme before first paint to avoid a flash.

## Making it yours

Everything below is placeholder content from the design handoff — edit
`src/config.ts` (and add assets) to replace it:

- **GitHub account** — `identity.githubUsername` drives the live API (currently
  `Charlie-C-1266`); `identity.githubHandle` is the displayed `@handle`.
- **Socials** — a real LinkedIn URL in `socials[]`.
- **Featured screenshot** — add `featured.screenshot.src` to swap the striped
  placeholder for a real image of `caniaffordthat.co.uk`.
- **Projects** — `work[]`.
- **Writing** — `posts[]` starts empty, so the section shows "coming soon"; add
  entries (`{ title, blurb, date, readingTime, url }`) to publish real posts.

Related: Charlie's portfolio lives at
<https://charlie-c-1266.github.io/my-portfolio/> and is slated for a restyle to
match this site's token system.
```
