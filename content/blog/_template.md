---
title: "Your post title here"
date: 2026-07-18
blurb: "One sentence shown on the homepage and the /blog index."
description: "Optional longer summary for the <meta name=description>. Falls back to blurb if omitted."
tags: [tag-one, tag-two]
---

Open with a paragraph that earns the reader's next thirty seconds.

## A section heading

Body copy in **Markdown**. Links, `inline code`, lists and fenced code blocks
all work. Keep images self-hosted under `public/blog/` (the CSP only allows
same-origin and `data:` images).

<!--
  How to publish this post:
    1. Copy this file to content/blog/<yyyy-mm-dd>-<short-slug>.md
    2. Fill in the frontmatter and body above.
    3. Run `npm run build:site` (or `npm run dev` to preview locally).
  The filename's leading date is stripped from the URL, so
  2026-07-18-flaky-tests.md is served at /blog/flaky-tests.
  Files whose name starts with "_" (like this one) are ignored by the build.
-->
