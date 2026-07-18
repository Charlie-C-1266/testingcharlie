import { describe, expect, it } from "vitest";
import { siteConfig } from "../../src/config.js";

describe("siteConfig", () => {
  it("provides the core identity fields", () => {
    const { identity } = siteConfig;
    expect(identity.brand).toBe("testingcharlie");
    expect(identity.email).toContain("@");
    expect(identity.githubUsername).toBeTruthy();
    expect(identity.githubUrl).toMatch(/^https:\/\/github\.com\//);
  });

  it("carries an SEO title; the meta description falls back to the hero brief", () => {
    // The build injects these into index.html — keep them the single source.
    expect(siteConfig.seo.title).toBeTruthy();
    // description is intentionally omitted so the brief lives only in hero.lead.
    expect(siteConfig.seo.description ?? siteConfig.hero.lead).toContain("Bristol");
  });

  it("has the eight-section content wired up", () => {
    expect(siteConfig.nav.length).toBeGreaterThan(0);
    expect(siteConfig.pipeline.stages).toContain("build");
    expect(siteConfig.pipeline.stats).toHaveLength(3);
    expect(siteConfig.marqueeKeywords.length).toBeGreaterThan(0);
    expect(siteConfig.work.length).toBeGreaterThan(0);
    expect(siteConfig.socials.length).toBeGreaterThan(0);
  });

  it("wires up blog posts from the generated manifest, each well-formed", () => {
    // Posts come from content/blog/*.md via scripts/build-blog-manifest.mjs.
    // With no posts the array is empty and the writing section shows
    // "coming soon"; here we assert whatever is present is shaped correctly.
    for (const post of siteConfig.posts) {
      expect(post.title).toBeTruthy();
      expect(post.url).toMatch(/^\/blog\//);
      expect(post.readingTime).toMatch(/\d+ min/);
    }
  });

  it("lists GitHub and LinkedIn socials but not Mastodon", () => {
    const labels = siteConfig.socials.map((social) => social.label);
    expect(labels).toContain("GitHub");
    expect(labels).toContain("LinkedIn");
    expect(labels).not.toContain("Mastodon");
  });

  it("marks exactly one pipeline stat as emphasised", () => {
    const emphasised = siteConfig.pipeline.stats.filter((stat) => stat.emphasis);
    expect(emphasised).toHaveLength(1);
  });

  it("links the portfolio from a hero chip", () => {
    const portfolio = siteConfig.hero.chips.find((chip) => chip.label.startsWith("Portfolio"));
    expect(portfolio?.href).toBe("https://charlie-c-1266.github.io/my-portfolio/");
  });
});
