import { expect, test } from "@playwright/test";

test.describe("theme toggle", () => {
  test("defaults to light and toggles to dark, with the label following the action", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    const toggle = page.getByTestId("theme-toggle");

    await expect(html).toHaveAttribute("data-theme", "light");
    await expect(toggle).toHaveText("☾ dark");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");

    await toggle.click();
    await expect(html).toHaveAttribute("data-theme", "dark");
    await expect(toggle).toHaveText("☀ light");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
  });

  test("persists the choice across a reload", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("theme-toggle").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByTestId("theme-toggle")).toHaveText("☀ light");
  });
});

test.describe("theme with dark OS preference", () => {
  test.use({ colorScheme: "dark" });

  test("starts in dark mode when the system prefers dark", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
});
