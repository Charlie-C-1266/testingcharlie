import { describe, expect, it } from "vitest";
// Pure build-time SEO generators (plain ESM, run by Node in the build pipeline,
// never shipped to the browser).
import {
  absoluteUrl,
  renderJsonLd,
  renderManifest,
  renderRobots,
  renderSitemap,
  renderSocialMeta,
  resolveSeo,
  trimTrailingSlash,
} from "../../scripts/seo.mjs";

/** A minimal siteConfig-shaped fixture (only the fields the generators read). */
function config(overrides = {}) {
  return {
    identity: {
      brand: "testingcharlie",
      brandTld: ".co.uk",
      githubUrl: "https://github.com/Charlie-C-1266",
    },
    socials: [
      { label: "GitHub", href: "https://github.com/Charlie-C-1266" },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/charlie" },
    ],
    hero: { lead: "Bristol-based senior test engineer." },
    seo: {
      title: "testingcharlie — Charlie · Senior Test Engineer",
      siteUrl: "https://www.testingcharlie.co.uk/", // trailing slash exercises the trim
      image: { path: "/og.png", alt: "Card & <alt>", width: 1200, height: 630, type: "image/png" },
      locale: "en_GB",
      person: { name: "Charlie", jobTitle: "Senior Test Engineer" },
      ...overrides,
    },
  };
}

describe("trimTrailingSlash / absoluteUrl", () => {
  it("drops trailing slashes", () => {
    expect(trimTrailingSlash("https://x.co.uk/")).toBe("https://x.co.uk");
    expect(trimTrailingSlash("https://x.co.uk///")).toBe("https://x.co.uk");
    expect(trimTrailingSlash("https://x.co.uk")).toBe("https://x.co.uk");
  });

  it("joins origins and paths, and passes absolute URLs through", () => {
    expect(absoluteUrl("https://x.co.uk/", "/og.png")).toBe("https://x.co.uk/og.png");
    expect(absoluteUrl("https://x.co.uk", "blog")).toBe("https://x.co.uk/blog");
    expect(absoluteUrl("https://x.co.uk", "https://cdn.example/y.png")).toBe("https://cdn.example/y.png");
  });
});

describe("resolveSeo", () => {
  it("derives canonical, image URL, site name and description from one config", () => {
    const seo = resolveSeo(config());
    expect(seo.siteUrl).toBe("https://www.testingcharlie.co.uk");
    expect(seo.canonicalUrl).toBe("https://www.testingcharlie.co.uk/");
    expect(seo.imageUrl).toBe("https://www.testingcharlie.co.uk/og.png");
    expect(seo.siteName).toBe("testingcharlie.co.uk");
    expect(seo.description).toBe("Bristol-based senior test engineer.");
  });

  it("prefers an explicit seo.description over the hero brief", () => {
    const seo = resolveSeo(config({ description: "Custom meta description." }));
    expect(seo.description).toBe("Custom meta description.");
  });

  it("builds a de-duplicated sameAs from the profile and socials", () => {
    // GitHub appears in both identity.githubUrl and socials — it must appear once.
    expect(resolveSeo(config()).sameAs).toEqual([
      "https://github.com/Charlie-C-1266",
      "https://www.linkedin.com/in/charlie",
    ]);
  });
});

describe("renderSocialMeta", () => {
  const meta = renderSocialMeta({
    type: "website",
    url: "https://www.testingcharlie.co.uk/",
    title: "testingcharlie — Charlie",
    description: "Bristol-based senior test engineer.",
    imageUrl: "https://www.testingcharlie.co.uk/og.png",
    image: { alt: "Card & <alt>", width: 1200, height: 630, type: "image/png" },
    siteName: "testingcharlie.co.uk",
    locale: "en_GB",
  });

  it("emits a canonical link and the core Open Graph tags", () => {
    expect(meta).toContain('<link rel="canonical" href="https://www.testingcharlie.co.uk/" />');
    expect(meta).toContain('<meta property="og:type" content="website" />');
    expect(meta).toContain('<meta property="og:url" content="https://www.testingcharlie.co.uk/" />');
    expect(meta).toContain('<meta property="og:image" content="https://www.testingcharlie.co.uk/og.png" />');
    expect(meta).toContain('<meta property="og:image:width" content="1200" />');
  });

  it("emits a large-image Twitter card", () => {
    expect(meta).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(meta).toContain('<meta name="twitter:image" content="https://www.testingcharlie.co.uk/og.png" />');
  });

  it("HTML-escapes attribute values (e.g. the image alt)", () => {
    expect(meta).toContain('content="Card &amp; &lt;alt&gt;"');
  });
});

describe("renderJsonLd", () => {
  const html = renderJsonLd({
    siteUrl: "https://www.testingcharlie.co.uk",
    siteName: "testingcharlie.co.uk",
    title: "testingcharlie — Charlie",
    description: "Bristol-based senior test engineer.",
    person: { name: "Charlie", jobTitle: "Senior Test Engineer" },
    sameAs: ["https://github.com/Charlie-C-1266"],
    imageUrl: "https://www.testingcharlie.co.uk/og.png",
  });

  function parsedGraph(markup: string): any[] {
    const json = markup.replace(/^<script[^>]*>/, "").replace(/<\/script>$/, "");
    return JSON.parse(json)["@graph"];
  }

  it("is a valid ld+json data block with Person + WebSite nodes", () => {
    expect(html.startsWith('<script type="application/ld+json">')).toBe(true);
    const graph = parsedGraph(html);
    const person = graph.find((n: any) => n["@type"] === "Person");
    const website = graph.find((n: any) => n["@type"] === "WebSite");
    expect(person.name).toBe("Charlie");
    expect(person.jobTitle).toBe("Senior Test Engineer");
    expect(person.sameAs).toEqual(["https://github.com/Charlie-C-1266"]);
    expect(website.url).toBe("https://www.testingcharlie.co.uk/");
    expect(website.publisher["@id"]).toBe(person["@id"]);
  });

  it("omits sameAs when there are no profiles", () => {
    const graph = parsedGraph(
      renderJsonLd({
        siteUrl: "https://x.co.uk",
        siteName: "x.co.uk",
        title: "x",
        description: "d",
        person: { name: "X", jobTitle: "Y" },
        sameAs: [],
        imageUrl: undefined,
      }),
    );
    expect(graph.find((n: any) => n["@type"] === "Person").sameAs).toBeUndefined();
  });

  it("escapes '<' so the payload can't break out of the script tag", () => {
    const html = renderJsonLd({
      siteUrl: "https://x.co.uk",
      siteName: "x.co.uk",
      title: "x",
      description: "danger </script><script>alert(1)",
      person: { name: "X", jobTitle: "Y" },
      sameAs: [],
      imageUrl: undefined,
    });
    const body = html.replace(/^<script[^>]*>/, "").replace(/<\/script>$/, "");
    expect(body).not.toContain("<script");
    expect(body).toContain("\\u003c/script");
  });
});

describe("renderRobots", () => {
  it("allows everything and points at the sitemap (trailing slash trimmed)", () => {
    const robots = renderRobots("https://www.testingcharlie.co.uk/");
    expect(robots).toContain("User-agent: *");
    expect(robots).toContain("Allow: /");
    expect(robots).toContain("Sitemap: https://www.testingcharlie.co.uk/sitemap.xml");
  });
});

describe("renderSitemap", () => {
  const xml = renderSitemap("https://www.testingcharlie.co.uk", [
    { path: "/" },
    { path: "/blog" },
    { path: "/blog/flaky-tests", lastmod: "2026-07-18" },
    { path: "https://external.example/x" },
  ]);

  it("is a well-formed urlset with absolute locations", () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain("<loc>https://www.testingcharlie.co.uk/</loc>");
    expect(xml).toContain("<loc>https://www.testingcharlie.co.uk/blog/flaky-tests</loc>");
    expect(xml).toContain("<loc>https://external.example/x</loc>");
  });

  it("includes lastmod only when provided", () => {
    expect(xml).toContain("<lastmod>2026-07-18</lastmod>");
    // The homepage entry has no lastmod → its <url> block carries none.
    const homeBlock = xml.slice(xml.indexOf("<loc>https://www.testingcharlie.co.uk/</loc>"));
    expect(homeBlock.slice(0, homeBlock.indexOf("</url>"))).not.toContain("<lastmod>");
  });
});

describe("renderManifest", () => {
  it("emits installable PWA metadata from the config", () => {
    const manifest = JSON.parse(renderManifest(config()));
    expect(manifest.name).toBe("testingcharlie.co.uk");
    expect(manifest.short_name).toBe("testingcharlie");
    expect(manifest.description).toBe("Bristol-based senior test engineer.");
    expect(manifest.theme_color).toBe("#181a1b");
    expect(manifest.icons.map((i: any) => i.sizes)).toContain("512x512");
    expect(manifest.icons.some((i: any) => i.purpose === "maskable")).toBe(true);
  });
});
