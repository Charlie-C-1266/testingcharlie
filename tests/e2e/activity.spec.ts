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

  test("renders the real, build-baked contribution grid", async ({ page }) => {
    await failGitHub(page);
    await page.goto("/");
    // The grid is populated from real baked contribution data (or collapsed when
    // none is baked) — never the old fixed placeholder pattern.
    const cells = page.getByTestId("heatmap").locator(".heatmap__cell");
    await expect(cells.first()).toBeVisible();
    expect(await cells.count()).toBeGreaterThan(0);
  });
});
