import type { Page } from "@playwright/test";

/** Deterministic GitHub API responses for hydration tests. */
export const githubUser = {
  login: "Charlie-C-1266",
  html_url: "https://github.com/Charlie-C-1266",
  public_repos: 77,
  name: "Charlie",
};

export const githubEvents = [
  {
    type: "PushEvent",
    created_at: new Date().toISOString(),
    repo: { name: "Charlie-C-1266/sentinel" },
    payload: {
      commits: [{ sha: "feedface0001", message: "e2e: hydrated commit from mock" }],
    },
  },
];

/** Serve fixture responses for every GitHub API call the page makes. */
export async function mockGitHub(page: Page): Promise<void> {
  await page.route("**://api.github.com/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/events/public")) {
      await route.fulfill({ json: githubEvents });
    } else {
      await route.fulfill({ json: githubUser });
    }
  });
}

/** Simulate GitHub being unreachable (offline / rate-limited). */
export async function failGitHub(page: Page): Promise<void> {
  await page.route("**://api.github.com/**", (route) => route.abort());
}
