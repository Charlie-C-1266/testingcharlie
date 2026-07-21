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
import {
  renderJsonLd,
  renderManifest,
  renderRobots,
  renderSitemap,
  renderSocialMeta,
  resolveSeo,
} from "./seo.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public");

/** HTML pages to publish, relative to the repo root. Add blog pages here. */
const PAGES = ["index.html"];

/** Copy the design stylesheets verbatim. */
async function copyStyles() {
  await cp(join(root, "styles"), join(out, "styles"), { recursive: true });
}

/**
 * Copy the committed brand assets (favicons, icons, og.png, self-hosted fonts)
 * from static/ into the output root — so they're served same-origin at
 * /favicon.svg, /og.png, /fonts/*.woff2, etc. Regenerate them with
 * `npm run gen:assets` (see scripts/gen-assets.mjs).
 */
async function copyStatic() {
  await cp(join(root, "static"), out, { recursive: true });
}

/**
 * Emit the SEO sidecar files from the same typed config: robots.txt, the PWA
 * web manifest, and a sitemap.xml listing the homepage, the blog index and
 * every post (absolute URLs from siteConfig.seo.siteUrl).
 */
async function writeSeoFiles(posts) {
  const { siteUrl } = resolveSeo(siteConfig);
  await writeFile(join(out, "robots.txt"), renderRobots(siteUrl));
  await writeFile(join(out, "site.webmanifest"), renderManifest(siteConfig));
  const entries = [
    { path: "/" },
    { path: "/blog" },
    ...posts.map((post) => ({ path: post.url, lastmod: post.date || undefined })),
  ];
  await writeFile(join(out, "sitemap.xml"), renderSitemap(siteUrl, entries));
}

/** Placeholder values injected into the HTML shell — see scripts/html-template.mjs. */
function pageTokens() {
  // All derived from the one typed siteConfig.seo, so the head can never drift
  // from the app: title, the brief (hero.lead unless overridden), the social
  // card meta and the JSON-LD structured data.
  const seo = resolveSeo(siteConfig);
  return {
    SEO_TITLE: escapeHtml(seo.title),
    SEO_DESCRIPTION: escapeHtml(seo.description),
    SOCIAL_META: renderSocialMeta({
      type: "website",
      url: seo.canonicalUrl,
      title: seo.title,
      description: seo.description,
      imageUrl: seo.imageUrl,
      image: seo.image,
      siteName: seo.siteName,
      locale: seo.locale,
    }),
    JSON_LD: renderJsonLd(seo),
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
  // Same resolved SEO context the homepage uses, so blog pages get a canonical
  // link + Open Graph card built from the one config.
  const site = resolveSeo(siteConfig);
  await mkdir(join(out, "blog"), { recursive: true });

  for (const post of posts) {
    await writeFile(join(out, "blog", `${post.slug}.html`), renderPostPage(post, site));
  }
  await writeFile(join(out, "blog", "index.html"), renderBlogIndex(posts, site));

  return posts;
}

async function main() {
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  await copyPages();
  await copyStyles();
  await copyScripts();
  await copyStatic();
  const posts = await buildBlog();
  await writeSeoFiles(posts);
  const postCount = posts.length;
  console.log(
    `Assembled static site → ${relative(root, out)}/ (${postCount} blog post${postCount === 1 ? "" : "s"})`,
  );
}

await main();
