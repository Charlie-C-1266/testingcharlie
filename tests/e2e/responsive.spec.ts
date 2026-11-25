import { expect, test } from "@playwright/test";

test.describe("responsive layout", () => {
  test("never scrolls horizontally", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
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

  // Widths where the stages only just fit beside the pipeline status, at both the
  // single-column and two-column layouts.
  for (const width of [390, 500, 1180, 1200]) {
    test(`keeps the pipeline status clear of the stages at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const { gap, inset } = await page.evaluate(() => {
        const status = document.querySelector(".pipeline__status")!.getBoundingClientRect();
        const tile = document.querySelector(".pipeline")!.getBoundingClientRect();
        let closest = Number.POSITIVE_INFINITY;
        for (const stage of document.querySelectorAll(".pipeline__stages > :not(.pipeline__status)")) {
          const box = stage.getBoundingClientRect();
          if (box.bottom > status.top && box.top < status.bottom) {
            closest = Math.min(closest, status.left - box.right);
          }
        }
        return { gap: closest, inset: tile.right - status.right };
      });
      expect(gap).toBeGreaterThanOrEqual(20);
      expect(inset).toBeLessThanOrEqual(16);
    });
  }
});
