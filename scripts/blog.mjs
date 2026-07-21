// Build-time blog engine: turn hand-authored Markdown into static HTML pages.
//
// This module is the single source of blog logic, shared by two build steps:
//   1. build-blog-manifest.mjs — writes src/posts.generated.ts so the homepage
//      "Writing" section lists posts at compile time (see src/config.ts).
//   2. build-site.mjs — renders each post + a /blog index into public/.
//
// It runs ONLY at build time. `marked` and everything here stay in Node; the
// browser only ever receives the generated static HTML — nothing new ships to
// it, so the site keeps its zero-runtime-dependency guarantee.
//
// Authoring format (see content/blog/_template.md):
//   ---
//   title: "My post title"
//   date: 2026-07-17            # ISO yyyy-mm-dd; drives ordering + display
//   blurb: One-line summary shown on the homepage and blog index.
//   description: Optional longer <meta name="description">. Falls back to blurb.
//   tags: [playwright, ci]      # optional
//   ---
//   Markdown body…

import { readFileSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { marked } from "marked";
import { absoluteUrl, renderSocialMeta } from "./seo.mjs";

// Repo root. Both the build scripts (`node scripts/…`) and Vitest always run
// with the working directory at the package root, so cwd is the reliable anchor
// here — and it avoids file-URL handling that differs under the test runner.
const root = process.cwd();

/** Directory of authored Markdown posts. */
export const CONTENT_DIR = join(root, "content", "blog");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * The exact inline anti-FOUC theme-boot script from index.html. Reusing it
 * verbatim means every blog page carries a byte-identical inline script, so the
 * single sha256 pinned in vercel.json's CSP covers them too — they can never
 * drift apart (blog.test.ts asserts this and matches the pinned hash).
 */
export const THEME_BOOT_SCRIPT = (() => {
  const html = readFileSync(join(root, "index.html"), "utf8");
  const match = html.match(/<script>([\s\S]*?)<\/script>/);
  if (match?.[1] === undefined) {
    throw new Error("Could not find the inline boot <script> in index.html");
  }
  return match[1];
})();

/** Escape the five HTML-significant characters for safe use in attributes/text. */
export function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Strip a single pair of matching surrounding quotes, if present. */
function stripQuotes(value) {
  const quoted = /^"(.*)"$/.exec(value) ?? /^'(.*)'$/.exec(value);
  return quoted ? quoted[1] : value;
}

/**
 * Parse a leading `---` YAML-ish frontmatter block. Supports `key: value`
 * (optionally quoted) and `key: [a, b]` list values — deliberately small, since
 * we own the input format. Returns the parsed data plus the Markdown body.
 *
 * @param {string} raw
 * @returns {{ data: Record<string, string | string[]>, body: string }}
 */
export function parseFrontmatter(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  if (!match) {
    return { data: {}, body: raw.trim() };
  }

  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) {
      continue;
    }
    const idx = line.indexOf(":");
    if (idx === -1) {
      continue;
    }
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (value.startsWith("[") && value.endsWith("]")) {
      data[key] = value
        .slice(1, -1)
        .split(",")
        .map((item) => stripQuotes(item.trim()))
        .filter((item) => item !== "");
    } else {
      data[key] = stripQuotes(value);
    }
  }

  return { data, body: raw.slice(match[0].length).trim() };
}

/** Estimate reading time at ~200 wpm (code fences and markup don't count). */
export function computeReadingTime(body) {
  const prose = body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`~\[\]()!-]/g, " ");
  const words = prose.split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 200))} min`;
}

/** Slug from a filename: drop `.md` and any leading `yyyy-mm-dd-` date prefix. */
export function deriveSlug(filename) {
  return basename(filename)
    .replace(/\.md$/i, "")
    .replace(/^\d{4}-\d{2}-\d{2}-/, "");
}

/** Format an ISO `yyyy-mm-dd` date as e.g. "17 Jul 2026" (falls back to input). */
export function formatDate(iso) {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!parts) {
    return iso;
  }
  const [, year, month, day] = parts;
  return `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}`;
}

/**
 * Shared <head>: self-hosted fonts, favicons/manifest, design tokens, site +
 * blog styles and the theme boot. When a `site` context is supplied (from the
 * build), the page also carries a canonical link and Open Graph / Twitter tags
 * built from the same generator the homepage uses. Fonts are same-origin, so
 * blog pages stay within the strict CSP just like index.html.
 *
 * @param {{ title: string, socialTitle: string, description: string, path: string, type: string }} page
 * @param {{ siteUrl: string, siteName: string, image: object, locale: string } | undefined} site
 */
function head(page, site) {
  const social = site
    ? `\n    ${renderSocialMeta({
        type: page.type,
        url: absoluteUrl(site.siteUrl, page.path),
        title: page.socialTitle,
        description: page.description,
        imageUrl: absoluteUrl(site.siteUrl, site.image.path),
        image: site.image,
        siteName: site.siteName,
        locale: site.locale,
      })}`
    : "";
  return `    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(page.title)} — testingcharlie</title>
    <meta name="description" content="${escapeHtml(page.description)}" />${social}
    <meta name="color-scheme" content="light dark" />
    <meta name="theme-color" media="(prefers-color-scheme: light)" content="#f3f2ec" />
    <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#181a1b" />

    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />

    <link rel="preload" href="/fonts/space-grotesk.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/fonts/jetbrains-mono.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="stylesheet" href="/styles/fonts.css" />
    <link rel="stylesheet" href="/styles/tokens.css" />
    <link rel="stylesheet" href="/styles/style.css" />
    <link rel="stylesheet" href="/styles/blog.css" />

    <script>${THEME_BOOT_SCRIPT}</script>`;
}

/** Render a single post to a complete, CSP-clean static HTML document. */
export function renderPostPage(post, site) {
  const description = post.description || post.blurb;
  const page = {
    title: post.title,
    socialTitle: post.title,
    description,
    path: post.url,
    type: "article",
  };
  return `<!doctype html>
<html lang="en">
  <head>
${head(page, site)}
  </head>
  <body class="post-page">
    <header class="post-topbar">
      <a class="post-topbar__home" href="/">← testingcharlie</a>
    </header>
    <main class="post" id="content">
      <article class="post__article">
        <p class="post__eyebrow">$ ~/writing</p>
        <h1 class="post__title">${escapeHtml(post.title)}</h1>
        <p class="post__meta">${escapeHtml(post.dateDisplay)} · ${escapeHtml(post.readingTime)}</p>
${post.bodyHtml}
      </article>
      <p class="post__back"><a href="/blog">← all posts</a></p>
    </main>
  </body>
</html>
`;
}

/** Render the /blog index listing every post, newest first. */
export function renderBlogIndex(posts, site) {
  const rows = posts.length
    ? posts
        .map(
          (post) => `        <a class="post-list__item" href="${post.url}">
          <span class="post-list__text">
            <span class="post-list__title">${escapeHtml(post.title)}</span>
            <span class="post-list__blurb">${escapeHtml(post.blurb)}</span>
          </span>
          <span class="post-list__meta">${escapeHtml(post.dateDisplay)}<br />${escapeHtml(post.readingTime)}</span>
        </a>`,
        )
        .join("\n")
    : `        <p class="post-list__empty">No posts yet — check back soon.</p>`;

  const page = {
    title: "Writing",
    socialTitle: "Writing",
    description: "Notes on test engineering, automation and CI from Charlie.",
    path: "/blog",
    type: "website",
  };
  return `<!doctype html>
<html lang="en">
  <head>
${head(page, site)}
  </head>
  <body class="post-page">
    <header class="post-topbar">
      <a class="post-topbar__home" href="/">← testingcharlie</a>
    </header>
    <main class="post" id="content">
      <p class="post__eyebrow">$ ~/writing</p>
      <h1 class="post__title">Writing</h1>
      <div class="post-list">
${rows}
      </div>
    </main>
  </body>
</html>
`;
}

/** Serialise the posts into the TypeScript module the homepage imports. */
export function renderPostsManifest(posts) {
  const entries = posts
    .map(
      (post) => `  {
    title: ${JSON.stringify(post.title)},
    blurb: ${JSON.stringify(post.blurb)},
    date: ${JSON.stringify(post.dateDisplay)},
    readingTime: ${JSON.stringify(post.readingTime)},
    url: ${JSON.stringify(post.url)},
  },`,
    )
    .join("\n");

  return `// @generated by scripts/build-blog-manifest.mjs — do not edit by hand.
// Rebuild with \`npm run build:site\` after adding or changing a post.
import type { Post } from "./types.js";

export const generatedPosts: Post[] = [${posts.length ? `\n${entries}\n` : ""}];
`;
}

/**
 * Read and parse every Markdown post in {@link CONTENT_DIR}. Files whose name
 * starts with `_` (e.g. _template.md) are skipped. Posts are returned newest
 * first. Each record carries both raw and display fields plus rendered `bodyHtml`.
 */
export async function loadPosts(dir = CONTENT_DIR) {
  let files;
  try {
    files = await readdir(dir);
  } catch {
    return []; // No content/blog directory yet — that's fine.
  }

  const markdown = files.filter((name) => name.endsWith(".md") && !name.startsWith("_"));

  const posts = await Promise.all(
    markdown.map(async (name) => {
      const raw = await readFile(join(dir, name), "utf8");
      const { data, body } = parseFrontmatter(raw);
      const slug = deriveSlug(name);
      const title = data.title ?? slug;
      const blurb = data.blurb ?? "";
      return {
        slug,
        url: `/blog/${slug}`,
        title,
        blurb,
        description: data.description ?? blurb,
        date: data.date ?? "",
        dateDisplay: formatDate(data.date ?? ""),
        readingTime: computeReadingTime(body),
        tags: data.tags ?? [],
        bodyHtml: marked.parse(body, { async: false }),
      };
    }),
  );

  return posts.sort((a, b) => b.date.localeCompare(a.date));
}
