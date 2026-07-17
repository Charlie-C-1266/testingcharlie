import { expect, test } from "@playwright/test";

test.describe("responsive layout", () => {
  test("never scrolls horizontally", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("stacks the hero and pipeline in a single column on narrow viewports", async ({ page }) => {
    const viewport = page.viewportSize();
    test.skip(!viewport || viewport.width > 900, "Only applies below the 900px breakpoint");

    await page.goto("/");
    const title = await page.locator(".hero__title").boundingBox();
    const pipeline = await page.locator(".pipeline").boundingBox();
    expect(title).not.toBeNull();
    expect(pipeline).not.toBeNull();
    // The pipeline panel drops below the hero text instead of sitting beside it.
    expect(pipeline!.y).toBeGreaterThan(title!.y + title!.height - 1);
  });
});
