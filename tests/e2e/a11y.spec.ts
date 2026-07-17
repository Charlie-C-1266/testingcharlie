import { expect, test } from "@playwright/test";

test.describe("accessibility basics", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("has a single h1 and labelled landmarks", async ({ page }) => {
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("nav[aria-label='Primary']")).toBeVisible();
    await expect(page.locator("footer#contact")).toBeVisible();
  });

  test("exposes a keyboard skip link", async ({ page }) => {
    const skip = page.locator(".skip-link");
    await expect(skip).toHaveAttribute("href", "#about");
    await skip.focus();
    await expect(skip).toBeFocused();
  });

  test("the theme toggle is a labelled, stateful button", async ({ page }) => {
    const toggle = page.getByTestId("theme-toggle");
    await expect(toggle).toHaveRole("button");
    await expect(toggle).toHaveAttribute("aria-label", /Switch to (dark|light) theme/);
    await expect(toggle).toHaveAttribute("aria-pressed", /true|false/);
  });

  test("every rendered image carries alt text", async ({ page }) => {
    const images = page.locator("img");
    const count = await images.count();
    for (let i = 0; i < count; i += 1) {
      await expect(images.nth(i)).toHaveAttribute("alt", /.+/);
    }
  });

  test("sections are individually labelled for screen readers", async ({ page }) => {
    await expect(page.locator("#about")).toHaveAttribute("aria-label", "Introduction");
    await expect(page.locator("#activity")).toHaveAttribute("aria-label", "Recent activity");
    await expect(page.locator("#work")).toHaveAttribute("aria-label", "More work");
    await expect(page.locator("#writing")).toHaveAttribute("aria-label", "Writing");
  });
});
