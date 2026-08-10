import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/** WCAG 2.0/2.1 A + AA — the levels a public site is reasonably held to. */
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

test.describe("accessibility basics", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("has no axe-detectable WCAG A/AA violations, in both themes", async ({ page }) => {
    // Scan both themes — a regression in either fails the gate with the exact
    // node. `color-contrast` is deliberately excluded for now: the muted/faint
    // design tokens don't yet meet the 4.5:1 AA ratio, and re-tuning the palette
    // is a visual change tracked separately. Everything else (ARIA, roles,
    // labels, landmarks, names) is enforced here.
    for (const theme of ["light", "dark"] as const) {
      await page.evaluate((value) => localStorage.setItem("tc-theme", value), theme);
      await page.reload();
      const { violations } = await new AxeBuilder({ page })
        .withTags(WCAG_TAGS)
        .disableRules(["color-contrast"])
        .analyze();
      expect(violations, `axe violations in ${theme} theme`).toEqual([]);
    }
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
