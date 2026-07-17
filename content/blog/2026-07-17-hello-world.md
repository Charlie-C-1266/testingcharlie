---
title: "Hello, world: how this blog works"
date: 2026-07-17
blurb: "A quick tour of the write-in-Markdown, render-at-build-time flow that powers these posts."
description: "How the testingcharlie blog turns a Markdown file into a fast, static, CSP-safe page — no framework, no client-side rendering."
tags: [meta, tooling]
---

Welcome to the first post on **testingcharlie**. This one is a placeholder, but
it doubles as documentation for how the blog itself is built — so when I write
the real first post, the flow is already proven.

## The whole flow in three steps

1. **Write** a Markdown file in `content/blog/`, with a small frontmatter block
   at the top (title, date, blurb).
2. **Run the build** (`npm run build:site`). A build step reads the Markdown,
   renders it to HTML, and writes a static page to `public/blog/<slug>`.
3. **Ship it.** The homepage "Writing" section and the `/blog` index pick up the
   new post automatically from a generated manifest — no hand-editing lists.

That's it. No client-side Markdown fetching, no framework, no bundler.

## Why render at build time?

Because this site is deliberately plain — hand-written TypeScript compiled with
`tsc`, loaded as ES modules, behind a strict Content-Security-Policy. Rendering
posts at build time keeps every one of those properties intact:

- Pages are **fully static HTML**, so they're fast and search-engine friendly.
- Nothing new ships to the browser — the Markdown renderer runs in Node only.
- The strict CSP still applies: each page reuses the same theme-boot script, so
  the existing pinned hash covers it with no policy changes.

## What Markdown gives you

You get the usual toolkit. Headings, **bold**, _italics_, and `inline code`
all work. Links are automatic: [the repo lives here](https://github.com/Charlie-C-1266/testingcharlie).

Lists too:

- Triage flaky specs before they erode trust in the suite
- Keep the pipeline honest with a real coverage gate
- Automate the boring parts so humans review the interesting ones

And fenced code blocks, styled but not yet syntax-highlighted:

```ts
export function readingTime(words: number): string {
  return `${Math.max(1, Math.ceil(words / 200))} min`;
}
```

> Blockquotes render as call-outs — handy for the one line you want people to
> remember.

## Next

Tomorrow this gets replaced with something real. To add a post, copy
`content/blog/_template.md`, fill it in, and rebuild. See you then.
