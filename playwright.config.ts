import { defineConfig, devices } from "@playwright/test";

const PORT = 4187;
const BASE_URL = `http://localhost:${PORT}`;

// Assembles the deployable static site (public/) then serves it on a fixed
// port — the same artifact Vercel ships, so the e2e suite exercises exactly
// what users get. Playwright waits for it to come up before running the suite.
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: {
    command: `npm run build:site && npx serve public -l ${PORT} --no-clipboard`,
    url: BASE_URL,
    // Always launch (and tear down) a fresh server so the suite can never bind
    // to an unrelated process that happens to hold the port.
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
