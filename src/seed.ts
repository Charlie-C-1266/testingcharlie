import { siteConfig } from "./config.js";
import {
  contributionCells,
  contributionTotal,
  publicRepoCount,
  recentCommits,
} from "./github-activity.generated.js";
import type { ActivityData, GitHubSummary } from "./types.js";

// First-paint + fallback data for the recent-activity section. Unlike the old
// placeholders, these values are REAL — baked from the GitHub API at build time
// (see scripts/github.mjs). Live hydration then refreshes the repo count and
// profile URL at runtime; the contribution calendar is populated at build only
// when GH_CONTRIB_TOKEN is set (empty otherwise, so the panel shows repos, never
// a fabricated grid).

/** GitHub panel summary, from build-baked real data. */
export const seedGitHub: GitHubSummary = {
  handle: siteConfig.identity.githubHandle,
  profileUrl: siteConfig.identity.githubUrl,
  contributions: contributionCells,
  contributionCount: contributionTotal,
  repoCount: publicRepoCount,
};

/** The complete seed for the recent-activity section. */
export const seedActivity: ActivityData = {
  commits: recentCommits,
  github: seedGitHub,
};
