import { expect, test } from "@playwright/test";
import { failGitHub, mockGitHub } from "./fixtures.js";

test.describe("recent activity", () => {
  test("hydrates the commit list and repo count from live GitHub data", async ({ page }) => {
    await mockGitHub(page);
    await page.goto("/");

    const commitList = page.getByTestId("commit-list");
    await expect(commitList.getByText("e2e: hydrated commit from mock")).toBeVisible();
    // Repo count comes from the mock (77); the exact caption wording depends on
    // whether a contribution total is baked, so just assert the number shows.
    await expect(page.getByTestId("github-caption")).toContainText("77");
  });

  test("falls back to the baked (real) seed data when GitHub is unreachable", async ({ page }) => {
    await failGitHub(page);
    await page.goto("/");

    // The seed is real, build-baked data — assert it renders without asserting
    // on specific values that change from build to build.
    await expect(page.getByTestId("commit-list").locator(".commit").first()).toBeVisible();
    await expect(page.getByTestId("github-caption")).toContainText("repos");
  });

  test("renders a contribution grid that mirrors the baked calendar, never a placeholder", async ({ page }) => {
    await failGitHub(page);
    await page.goto("/");
    const heatmap = page.getByTestId("heatmap");
    const cells = heatmap.locator(".heatmap__cell");
    // Invariant (holds in both states, so the test survives a tokenless bake):
    // the grid reflects the REAL baked calendar — it either collapses to zero
    // cells (nothing baked) or renders one cell per real day; it is never the old
    // fixed fabricated placeholder pattern. The `heatmap--empty` class and the
    // cell count must agree, and populated cells carry a real "<n> on <date>".
    const isEmpty = await heatmap.evaluate((el) => el.classList.contains("heatmap--empty"));
    if (isEmpty) {
      expect(await cells.count()).toBe(0);
    } else {
      expect(await cells.count()).toBeGreaterThan(0);
      await expect(cells.first()).toBeVisible();
      await expect(cells.first()).toHaveAttribute("title", /on \d{4}-\d{2}-\d{2}$/);
    }
  });
});
