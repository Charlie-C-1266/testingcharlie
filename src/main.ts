// Entry point for index.html (loaded as `dist/main.js`). This is the thin
// composition root: it constructs the real dependencies and hands them to
// mountApp. All the interesting logic lives in the injectable modules it wires
// together, which is where the tests point.

import { mountApp } from "./app.js";
import { siteConfig } from "./config.js";
import { LiveDataSource } from "./data-source.js";
import { GitHubClient } from "./github/client.js";
import { seedActivity } from "./seed.js";
import { ThemeController } from "./theme.js";

const root = document.getElementById("app");
if (root) {
  const client = new GitHubClient({ username: siteConfig.identity.githubUsername });
  const dataSource = new LiveDataSource({ client, seed: seedActivity });
  const theme = new ThemeController();
  mountApp({ root, config: siteConfig, dataSource, theme });
}
