---
title: "Your post title here"
date: 2026-07-18
blurb: "One sentence shown on the homepage and the /blog index."
description: "Optional longer summary for the <meta name=description>. Falls back to blurb if omitted."
tags: [tag-one, tag-two]
draft: true
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
    3. Preview it with `BLOG_INCLUDE_DRAFTS=1 npm run dev`.
    4. When it's ready, DELETE the `draft: true` line and run `npm run build:site`.
  The filename's leading date is stripped from the URL, so
  2026-07-18-flaky-tests.md is served at /blog/flaky-tests.
  Files whose name starts with "_" (like this one) are ignored by the build.

  `draft: true` keeps a post out of every build output, so an unfinished file
  in content/blog/ can never reach the site. It is set here on purpose: a copy
  of this template starts unpublished, and publishing is a deliberate edit.
  tests/unit/blog-drafts.test.ts fails the build if a draft — or a post whose
  source file git doesn't track — ever lands in src/posts.generated.ts.
-->
