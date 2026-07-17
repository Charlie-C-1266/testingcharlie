import { expect, test } from "@playwright/test";
import { failGitHub, mockGitHub } from "./fixtures.js";

test.describe("recent activity hydration", () => {
  test("replaces seed commits with live GitHub data", async ({ page }) => {
    await mockGitHub(page);
    await page.goto("/");

    const commitList = page.getByTestId("commit-list");
    await expect(commitList.getByText("e2e: hydrated commit from mock")).toBeVisible();
    await expect(page.getByTestId("github-caption")).toContainText("77 repos");
  });

  test("falls back to seed data when GitHub is unreachable", async ({ page }) => {
    await failGitHub(page);
    await page.goto("/");

    const commitList = page.getByTestId("commit-list");
    await expect(commitList.getByText("ci: quarantine flaky checkout spec")).toBeVisible();
    await expect(page.getByTestId("github-caption")).toContainText("34 repos");
  });

  test("renders a full contribution heat grid", async ({ page }) => {
    await failGitHub(page);
    await page.goto("/");
    await expect(page.getByTestId("heatmap").locator(".heatmap__cell")).toHaveCount(105);
  });
});
