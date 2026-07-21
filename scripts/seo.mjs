// Build-time SEO / social-metadata generators.
//
// Pure functions that turn the typed siteConfig (src/config.ts) into the head
// tags and sidecar files search engines and social cards need:
//   - renderSocialMeta  → canonical + Open Graph + Twitter Card <meta> block
//   - renderJsonLd      → schema.org Person + WebSite structured data
//   - renderRobots      → robots.txt
//   - renderSitemap     → sitemap.xml
//   - renderManifest    → site.webmanifest (PWA install metadata)
//
// Everything here runs ONLY in Node at build time (scripts/build-site.mjs wires
// it to the real config) and is unit-tested (tests/unit/seo.test.ts) — the copy
// lives in exactly one place and can never drift from the app.

import { escapeHtml } from "./html-template.mjs";

/** Drop a single trailing slash so origins concatenate cleanly. */
export function trimTrailingSlash(url) {
  return url.replace(/\/+$/, "");
}

/** Join a site origin and a root-relative path into one absolute URL. */
export function absoluteUrl(siteUrl, path) {
  if (/^https?:\/\//.test(path)) {
    return path;
  }
  return `${trimTrailingSlash(siteUrl)}${path.startsWith("/") ? path : `/${path}`}`;
}

/** De-duplicate URLs, preserving first-seen order (for JSON-LD `sameAs`). */
function uniqueUrls(urls) {
  return [...new Set(urls.filter(Boolean))];
}

/**
 * Resolve the derived SEO values used across the build: the effective
 * description (hero brief unless overridden), the canonical origin, the
 * absolute share-image URL and the site name — from a single config.
 */
export function resolveSeo(config) {
  const { seo, hero, identity, socials } = config;
  const siteUrl = trimTrailingSlash(seo.siteUrl);
  return {
    siteUrl,
    siteName: `${identity.brand}${identity.brandTld}`,
    title: seo.title,
    description: seo.description ?? hero.lead,
    canonicalUrl: `${siteUrl}/`,
    image: seo.image,
    imageUrl: absoluteUrl(siteUrl, seo.image.path),
    locale: seo.locale,
    person: seo.person,
    sameAs: uniqueUrls([identity.githubUrl, ...socials.map((social) => social.href)]),
  };
}

/**
 * Canonical link + Open Graph + Twitter Card tags. Generic over the page so a
 * blog post can reuse it with its own `url`/`title`/`description`/`type`.
 */
export function renderSocialMeta({ type, url, title, description, imageUrl, image, siteName, locale }) {
  const meta = (attr, key, value) => `<meta ${attr}="${key}" content="${escapeHtml(String(value))}" />`;
  return [
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    meta("property", "og:type", type),
    meta("property", "og:site_name", siteName),
    meta("property", "og:title", title),
    meta("property", "og:description", description),
    meta("property", "og:url", url),
    meta("property", "og:locale", locale),
    meta("property", "og:image", imageUrl),
    meta("property", "og:image:type", image.type),
    meta("property", "og:image:width", image.width),
    meta("property", "og:image:height", image.height),
    meta("property", "og:image:alt", image.alt),
    meta("name", "twitter:card", "summary_large_image"),
    meta("name", "twitter:title", title),
    meta("name", "twitter:description", description),
    meta("name", "twitter:image", imageUrl),
    meta("name", "twitter:image:alt", image.alt),
  ].join("\n    ");
}

/**
 * schema.org Person + WebSite as a JSON-LD `@graph`. Rendered in a
 * `type="application/ld+json"` data block, which the strict CSP allows without
 * a hash because the browser never executes it. `<` is escaped to `<` so
 * the payload can't break out of the surrounding <script> tag.
 */
export function renderJsonLd({ siteUrl, siteName, title, description, person, sameAs, imageUrl }) {
  const homepage = `${trimTrailingSlash(siteUrl)}/`;
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${siteUrl}/#person`,
        name: person.name,
        jobTitle: person.jobTitle,
        url: homepage,
        description,
        ...(sameAs.length ? { sameAs } : {}),
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: siteName,
        alternateName: title,
        url: homepage,
        description,
        ...(imageUrl ? { image: imageUrl } : {}),
        publisher: { "@id": `${siteUrl}/#person` },
      },
    ],
  };
  const json = JSON.stringify(graph, null, 2).replace(/</g, "\\u003c");
  return `<script type="application/ld+json">\n${json}\n    </script>`;
}

/** robots.txt: allow everything and point crawlers at the sitemap. */
export function renderRobots(siteUrl) {
  const base = trimTrailingSlash(siteUrl);
  return `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`;
}

/**
 * sitemap.xml from a list of `{ path, lastmod? }` entries. `path` may be
 * root-relative ("/", "/blog/x") or already absolute; `lastmod` is an optional
 * ISO date.
 */
export function renderSitemap(siteUrl, entries) {
  const urls = entries
    .map(({ path, lastmod }) => {
      const loc = escapeHtml(absoluteUrl(siteUrl, path));
      const mod = lastmod ? `\n    <lastmod>${escapeHtml(lastmod)}</lastmod>` : "";
      return `  <url>\n    <loc>${loc}</loc>${mod}\n  </url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/**
 * site.webmanifest for installability. Colours mirror the design tokens
 * (--page / --band in styles/tokens.css); icons are the baked PNGs in static/.
 */
export function renderManifest(config) {
  const { identity, hero, seo } = config;
  const manifest = {
    name: `${identity.brand}${identity.brandTld}`,
    short_name: identity.brand,
    description: seo.description ?? hero.lead,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f3f2ec",
    theme_color: "#181a1b",
    icons: [
      { src: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { src: "/icon-512.png", type: "image/png", sizes: "512x512" },
      { src: "/icon-512.png", type: "image/png", sizes: "512x512", purpose: "maskable" },
    ],
  };
  return `${JSON.stringify(manifest, null, 2)}\n`;
}
