import { expect, test } from "@playwright/test";

// Exercises the whole authored-Markdown → static-page flow against the built
// site (the same public/ bundle Vercel ships), including the CSP-critical
// theme-boot script running on a generated page.
test.describe("blog", () => {
  test("lists the sample post in the homepage writing section", async ({ page }) => {
    await page.goto("/");
    const writing = page.locator("#writing");
    await expect(writing.locator(".post__title")).toContainText("how this blog works");
    await expect(writing.locator("a.post").first()).toHaveAttribute("href", "/blog/hello-world");
  });

  test("navigates from the homepage to the rendered post page", async ({ page }) => {
    await page.goto("/");
    await page.locator("#writing a.post").first().click();
    await expect(page).toHaveURL(/\/blog\/hello-world$/);
    await expect(page.locator("h1.post__title")).toContainText("how this blog works");
    await expect(page.locator(".post__article")).toContainText("build time");
    // The inline boot script (allowed by the strict CSP) must have set the theme.
    await expect(page.locator("html")).toHaveAttribute("data-theme", /^(light|dark)$/);
  });

  test("serves the /blog index listing the post", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.locator("h1.post__title")).toContainText("Writing");
    await expect(page.locator(".post-list__item")).toContainText("how this blog works");
  });
});
