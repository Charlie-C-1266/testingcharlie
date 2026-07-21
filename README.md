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
styles/fonts.css        @font-face for the self-hosted (same-origin) web fonts
src/
  types.ts              All domain interfaces (the compile-time contract)
  config.ts             Hand-authored content + settings  ← edit this
  posts.generated.ts    Blog manifest, generated from content/blog/*.md
  seed.ts               Fallback/first-paint data for the live panels
  dom.ts                Typed element helpers (el, linkTo, multiline…)
  time.ts               relativeTime() for git-log timestamps
  theme.ts              ThemeController (localStorage + prefers-color-scheme)
  reporting.ts          Dependency-free client error/RUM reporting seam
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
content/
  blog/                 Authored posts in Markdown (+ _template.md) ← write here
static/                 Brand assets copied verbatim → public/ root
  favicon.svg, *.png, favicon.ico, og.png   icons + 1200×630 social card
  fonts/*.woff2         Self-hosted Space Grotesk + JetBrains Mono (variable)
scripts/
  blog.mjs              Build-time blog engine (Markdown → HTML, manifest)
  build-blog-manifest.mjs  Writes src/posts.generated.ts (runs before tsc)
  build-site.mjs        Assembles the deployable bundle → public/
  seo.mjs               SEO/social generators (OG, JSON-LD, robots, sitemap)
  gen-assets.mjs        Regenerate favicons + OG card (npm run gen:assets)
tests/
  unit/                 Vitest (jsdom) — render fns, theme, client, mappers, CSP, blog
  e2e/                  Playwright — theme, hydration, responsive, a11y, blog
vercel.json             Build/output settings + security headers (CSP etc.)
```

Each render function is pure — it takes typed data and returns a detached
`HTMLElement`, which makes the whole UI unit-testable in jsdom. `main.ts` is the
only module that reaches for real browser globals.

## Data & the GitHub API

The recent-activity section shows **real** GitHub data, never placeholders. It is
sourced in two ways:

**Baked at build time** (`scripts/build-github-activity.mjs` → the committed
`src/github-activity.generated.ts`, consumed by `src/seed.ts`):

- **recent commits** ← read from the repos you most recently pushed to
  (`GET /repos/{repo}/commits`), merged newest-first, merge-commits dropped.
  NB: the public *events* endpoint no longer returns commit details, so we can't
  derive commit messages from it — hence reading the repos directly.
- **public repo count** and **profile URL** ← `GET /users/{user}`.
- **contribution calendar + yearly total** ← GitHub **GraphQL** (`contributions
  collection`). This needs authentication, so it is fetched **only when
  `GH_CONTRIB_TOKEN` is set** at build time.

**Refreshed live at runtime** — `LiveDataSource` re-fetches the repo count and
profile in the browser so they stay current between deploys. Any failure
(offline, rate-limited) is swallowed and the baked data stays.

> The build step is resilient: a network/token failure leaves the last committed
> `github-activity.generated.ts` untouched and never blocks a build.

### Enabling the contribution graph (`GH_CONTRIB_TOKEN`)

The heat grid and "N contributions in the last year" figure need a token
(everything else is public). Without one, the panel honestly shows just your
public repo count — no fabricated grid.

1. Create a **read-only** GitHub token — a fine-grained PAT (no extra scopes
   needed for public contributions) or a classic PAT with `read:user`.
2. Add it to the **Vercel** project → Settings → Environment Variables as
   `GH_CONTRIB_TOKEN`. It is a **build secret** and is never shipped to the
   browser (only the resulting public numbers are baked into static output).
3. To preview locally: `GH_CONTRIB_TOKEN=xxx npm run build:site` (or
   `npm run refresh:github`), then commit the regenerated
   `src/github-activity.generated.ts`.

Each deploy re-bakes fresh data. The calendar reflects the last 12 months as of
the build.

## Writing (the blog)

Posts are authored in **Markdown** and rendered to static HTML **at build
time** — no client-side Markdown, no framework, and the strict CSP is preserved
(every post reuses the same theme-boot script, so the existing pinned hash
covers it).

To publish a post:

```bash
cp content/blog/_template.md content/blog/2026-07-18-my-post.md   # name it <date>-<slug>.md
$EDITOR content/blog/2026-07-18-my-post.md                        # fill in frontmatter + body
npm run dev                                                       # build + preview locally
```

The leading `yyyy-mm-dd-` in the filename is stripped for the URL, so that file
is served at **`/blog/my-post`**. Files whose name starts with `_` are ignored.

What the build does (`npm run build:site`), in order:

1. `scripts/build-blog-manifest.mjs` reads `content/blog/*.md` and writes
   `src/posts.generated.ts` — the typed list the homepage **Writing** section
   and the `/blog` index render from (date + reading time are derived for you).
2. `tsc` compiles the site (now including the manifest).
3. `scripts/build-site.mjs` renders each post to `public/blog/<slug>.html` plus
   a `public/blog/index.html` listing.

Frontmatter fields: `title`, `date` (ISO `yyyy-mm-dd`), `blurb`, optional
`description` (meta; falls back to `blurb`) and optional `tags`. Post images
must be self-hosted (the CSP allows same-origin and `data:` images only).

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

## Deployment

The site deploys to [Vercel](https://vercel.com) as a plain static site — there
is no framework preset and no server.

`npm run build:site` compiles the TypeScript and then runs
`scripts/build-site.mjs`, which assembles a **`public/`** directory containing
*only* what the browser needs:

```
public/
  index.html
  styles/*.css
  dist/**/*.js      compiled modules only — no .ts, .d.ts or source maps
```

Nothing else from the repo (`src/`, `tests/`, tooling configs, `package.json`,
`node_modules`) is copied in, so none of it is reachable as a URL on the live
site. `vercel.json` pins this contract so the dashboard needs no manual setup:

- **Build Command** `npm run build:site`
- **Output Directory** `public`
- **Framework Preset** Other (`"framework": null`)
- `cleanUrls` is on, so `public/blog/my-post.html` serves at `/blog/my-post`.
  Blog pages are generated from Markdown — see [Writing](#writing-the-blog).

`vercel.json` also sends security headers on every response: a strict,
**same-origin Content-Security-Policy** — scripts limited to same-origin plus
the one inline boot script (pinned by sha256 hash), styles and fonts to
same-origin only (the web fonts are self-hosted, below), and connections limited
to the GitHub API — plus `X-Content-Type-Options`, `X-Frame-Options`,
`Referrer-Policy`, `Strict-Transport-Security` and `Permissions-Policy`. A unit
test (`tests/unit/csp.test.ts`) keeps the pinned script hash in sync with
`index.html` and asserts no third-party font origin creeps back in, so the
policy can never silently start blocking the page.

The Playwright suite serves this same `public/` bundle, so the e2e tests
exercise exactly what Vercel ships.

### SEO, social & icons

The canonical link, Open Graph / Twitter card and JSON-LD `Person` + `WebSite`
are generated at build from `siteConfig.seo` (`scripts/seo.mjs`) — one source,
no hand-maintained duplicate in the head. The same build step emits `robots.txt`,
`sitemap.xml` and `site.webmanifest`. Favicons, the apple-touch-icon and the
1200×630 `og.png` live under `static/` and are regenerated from
`static/favicon.svg` + the fonts with `npm run gen:assets` (headless Chromium).
Set the production origin once via `siteConfig.seo.siteUrl`.

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
- **UI strings** — every fixed on-page label (section prompts like `$ ~/writing`,
  the "get in touch" button, the theme-toggle text, the `ci/cd pipeline` /
  `github` panel titles, the "coming soon" placeholder) lives in `ui`, so there
  are no words hard-coded in the render layer to hunt down.
- **Writing** — posts are authored as Markdown in `content/blog/` and generated
  at build time; see [Writing](#writing-the-blog). Remove the sample post
  (`content/blog/2026-07-17-hello-world.md`) once you publish a real one.

Related: Charlie's portfolio lives at
<https://charlie-c-1266.github.io/my-portfolio/> and is slated for a restyle to
match this site's token system.
```
