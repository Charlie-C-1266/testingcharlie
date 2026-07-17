import { siteConfig } from "./config.js";
import type { ActivityData, Commit, ContributionCell, GitHubSummary, HeatLevel } from "./types.js";

// Seed activity data. It is what the recent-activity section renders on first
// paint, and the fallback whenever the live GitHub API is unreachable or
// rate-limited — so the page always looks complete. Replace the commit list
// once the live API is wired for your account; the numbers are illustrative.

/** Placeholder git-log rows (design handoff seed data). */
export const seedCommits: Commit[] = [
  { hash: "a1f9c2", message: "ci: quarantine flaky checkout spec", relativeTime: "2h ago" },
  { hash: "7e40b1", message: "feat: parallelise e2e suite across 4 shards", relativeTime: "yesterday" },
  { hash: "c3d8aa", message: "test: add contract tests for payments API", relativeTime: "3d ago" },
  { hash: "0b52f7", message: "chore: bump playwright to 1.52", relativeTime: "5d ago" },
  { hash: "9fd1e4", message: "docs: write the flaky-test triage runbook", relativeTime: "1w ago" },
];

/**
 * Build a stable, organic-looking contribution grid (7 rows × ~15 weeks).
 * Deterministic (fixed seed) so the placeholder never flickers between loads
 * and unit tests can assert on it.
 */
export function buildSeedContributions(count = 105): ContributionCell[] {
  const cells: ContributionCell[] = [];
  let state = 0x1a2b3c4d;
  const next = (): number => {
    // Small deterministic LCG — good enough for a decorative pattern.
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };

  for (let i = 0; i < count; i += 1) {
    const roll = next();
    const level: HeatLevel =
      roll < 0.45 ? 0 : roll < 0.65 ? 1 : roll < 0.82 ? 2 : roll < 0.94 ? 3 : 4;
    const dayCount = level === 0 ? 0 : level * 2 + Math.floor(next() * 3);
    cells.push({ level, count: dayCount });
  }
  return cells;
}

/** Placeholder GitHub panel summary (contribution count / repos are seeds). */
export const seedGitHub: GitHubSummary = {
  handle: siteConfig.identity.githubHandle,
  profileUrl: siteConfig.identity.githubUrl,
  contributions: buildSeedContributions(),
  contributionCount: 1204,
  repoCount: 34,
};

/** The complete seed for the recent-activity section. */
export const seedActivity: ActivityData = {
  commits: seedCommits,
  github: seedGitHub,
};
