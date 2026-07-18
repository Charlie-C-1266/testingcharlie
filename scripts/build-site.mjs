// Assemble the deployable static site into ./public from already-built inputs.
//
// The deployed bundle contains ONLY what the page needs to run in a browser:
//   index.html          the page shell
//   styles/*.css         design tokens + component styles
//   dist/**/*.js         compiled ES modules (source maps + .d.ts omitted)
//
// Everything else in the repo (src/, tests/, tooling configs, package.json,
// node_modules) is deliberately left out, so none of it is reachable as a URL
// on the deployed site. Run after `tsc` (see the `build:site` npm script).
//
// Adding pages later (e.g. a blog): drop more *.html into the copy step below
// and they land alongside index.html in public/ — no other change needed.

import {
  cp,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
// Built from src/ by `tsc` (which runs before this script in `build:site`), so
// the shipped page derives its SEO copy from the same typed config the app
// uses — never a second hard-coded copy in index.html.
import { siteConfig } from "../dist/config.js";
import { loadPosts, renderBlogIndex, renderPostPage } from "./blog.mjs";
import { applyTemplate, escapeHtml } from "./html-template.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public");

/** HTML pages to publish, relative to the repo root. Add blog pages here. */
const PAGES = ["index.html"];

/** Copy the design stylesheets verbatim. */
async function copyStyles() {
  await cp(join(root, "styles"), join(out, "styles"), { recursive: true });
}

/** Placeholder values injected into the HTML shell — see scripts/html-template.mjs. */
function pageTokens() {
  return {
    SEO_TITLE: escapeHtml(siteConfig.seo.title),
    // The brief is authored once as hero.lead; SEO reuses it unless overridden.
    SEO_DESCRIPTION: escapeHtml(siteConfig.seo.description ?? siteConfig.hero.lead),
  };
}

/** Fill each published page's `__TOKEN__` placeholders and write it to the output root. */
async function copyPages() {
  const tokens = pageTokens();
  for (const page of PAGES) {
    const shell = await readFile(join(root, page), "utf8");
    await writeFile(join(out, page), applyTemplate(shell, tokens));
  }
}

/**
 * Copy the compiled JavaScript from dist/, preserving the directory layout but
 * taking only runtime `.js` files. Declaration files (`.d.ts`) and source maps
 * are skipped, and the trailing `//# sourceMappingURL=` comment is stripped so
 * the shipped modules carry no reference back to the TypeScript sources.
 */
async function copyScripts() {
  const distDir = join(root, "dist");
  const entries = await readdir(distDir, {
    recursive: true,
    withFileTypes: true,
  });

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".js")) {
      continue;
    }
    const abs = join(entry.parentPath, entry.name);
    const dest = join(out, "dist", relative(distDir, abs));
    const code = await readFile(abs, "utf8");
    const withoutMapRef = code
      .split("\n")
      .filter((line) => !line.startsWith("//# sourceMappingURL="))
      .join("\n");

    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, withoutMapRef.trimEnd() + "\n");
  }
}

/**
 * Render each Markdown post to public/blog/<slug>.html plus a /blog index.
 * The pages are self-contained static HTML (see scripts/blog.mjs); `cleanUrls`
 * in vercel.json serves them at /blog/<slug> and /blog.
 */
async function buildBlog() {
  const posts = await loadPosts();
  await mkdir(join(out, "blog"), { recursive: true });

  for (const post of posts) {
    await writeFile(join(out, "blog", `${post.slug}.html`), renderPostPage(post));
  }
  await writeFile(join(out, "blog", "index.html"), renderBlogIndex(posts));

  return posts.length;
}

async function main() {
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  await copyPages();
  await copyStyles();
  await copyScripts();
  const postCount = await buildBlog();
  console.log(
    `Assembled static site → ${relative(root, out)}/ (${postCount} blog post${postCount === 1 ? "" : "s"})`,
  );
}

await main();
