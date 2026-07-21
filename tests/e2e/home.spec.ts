import { expect, test } from "@playwright/test";

test.describe("homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders the hero headline and lead", async ({ page }) => {
    const h1 = page.locator("h1.hero__title");
    await expect(h1).toBeVisible();
    await expect(h1).toContainText("I break things");
    await expect(h1).toContainText("so users don't");
    await expect(page.locator(".hero__kicker")).toContainText("Senior Test Engineer");
  });

  test("renders all eight sections top to bottom", async ({ page }) => {
    await expect(page.locator("header.nav")).toBeVisible();
    await expect(page.locator("#about.hero")).toBeVisible();
    await expect(page.locator(".marquee")).toBeAttached();
    await expect(page.locator(".featured")).toBeVisible();
    await expect(page.locator("#activity")).toBeVisible();
    await expect(page.locator("#work")).toBeVisible();
    await expect(page.locator("#writing")).toBeVisible();
    await expect(page.locator("footer#contact")).toBeVisible();
  });

  test("shows the CI pipeline stats", async ({ page }) => {
    const pipeline = page.locator(".pipeline");
    await expect(pipeline.getByText("214")).toBeVisible();
    await expect(pipeline.getByText("96%")).toBeVisible();
    await expect(pipeline.getByText("0.2%")).toBeVisible();
    await expect(pipeline.locator(".pass")).toHaveCount(4);
  });

  test("bakes the SEO title + description into the served head from config", async ({ page }) => {
    // Proves the __SEO_*__ placeholders were replaced at build with the real
    // config values — the head is no longer a second hard-coded copy.
    await expect(page).toHaveTitle(/testingcharlie/);
    await expect(page.locator('head > meta[name="description"]')).toHaveAttribute(
      "content",
      /^Bristol-based senior test engineer building/,
    );
  });

  test("exposes canonical, Open Graph and Twitter card metadata", async ({ page }) => {
    await expect(page.locator('head > link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://www.testingcharlie.co.uk/",
    );
    await expect(page.locator('head > meta[property="og:title"]')).toHaveAttribute("content", /testingcharlie/);
    await expect(page.locator('head > meta[property="og:image"]')).toHaveAttribute(
      "content",
      "https://www.testingcharlie.co.uk/og.png",
    );
    await expect(page.locator('head > meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );
  });

  test("ships JSON-LD structured data (Person + WebSite)", async ({ page }) => {
    const ld = await page.locator('head > script[type="application/ld+json"]').textContent();
    const graph = JSON.parse(ld ?? "{}")["@graph"];
    const types = graph.map((node) => node["@type"]);
    expect(types).toEqual(expect.arrayContaining(["Person", "WebSite"]));
  });

  test("self-hosts the fonts (no Google Fonts) and loads the display face", async ({ page }) => {
    await expect(page.locator('head link[href*="fonts.googleapis.com"]')).toHaveCount(0);
    await expect(page.locator('head link[href*="fonts.gstatic.com"]')).toHaveCount(0);
    const loaded = await page.evaluate(async () => {
      await document.fonts.ready;
      return document.fonts.check('700 16px "Space Grotesk"');
    });
    expect(loaded).toBe(true);
  });

  test("serves the SEO sidecar files and brand assets", async ({ page }) => {
    for (const path of [
      "/robots.txt",
      "/sitemap.xml",
      "/site.webmanifest",
      "/favicon.svg",
      "/favicon.ico",
      "/og.png",
      "/apple-touch-icon.png",
    ]) {
      const response = await page.request.get(path);
      expect(response.status(), path).toBe(200);
    }
  });

  test("has working section anchor links in the nav", async ({ page }) => {
    await expect(page.locator(".nav__link", { hasText: "work" })).toHaveAttribute("href", "#work");
    await expect(page.locator(".nav__link", { hasText: "writing" })).toHaveAttribute("href", "#writing");
    await expect(page.locator(".nav__link", { hasText: "about" })).toHaveAttribute("href", "#about");
  });

  test("marquee duplicates its keyword list for a seamless loop", async ({ page }) => {
    const items = page.getByTestId("marquee-track").locator(".marquee__item");
    await expect(items).toHaveCount(16);
  });

  test("footer exposes a mailto contact", async ({ page }) => {
    await expect(page.locator(".site-footer__email")).toHaveAttribute("href", /^mailto:/);
  });

  test("writing section lists published posts", async ({ page }) => {
    // Posts are generated from content/blog/*.md; at least the sample post ships.
    await expect(page.locator("#writing a.post").first()).toBeVisible();
    await expect(page.locator("#writing .writing__soon")).toHaveCount(0);
  });

  test("hero links to the portfolio in a new tab", async ({ page }) => {
    const portfolio = page.locator(".hero__chips .chip", { hasText: "Portfolio" });
    await expect(portfolio).toHaveAttribute("href", "https://charlie-c-1266.github.io/my-portfolio/");
    await expect(portfolio).toHaveAttribute("target", "_blank");
    await expect(portfolio).toHaveAttribute("rel", "noopener noreferrer");
  });
});
