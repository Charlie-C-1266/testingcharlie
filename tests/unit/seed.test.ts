import { describe, expect, it } from "vitest";
import { seedActivity, seedGitHub } from "../../src/seed.js";
import { recentCommits } from "../../src/github-activity.generated.js";
import { siteConfig } from "../../src/config.js";

// The seed is now build-baked real data (scripts/github.mjs), so these assert
// structure/provenance rather than specific placeholder values.
describe("seed data", () => {
  it("derives the github summary branding from the site config", () => {
    expect(seedGitHub.handle).toBe(siteConfig.identity.githubHandle);
    expect(seedGitHub.profileUrl).toBe(siteConfig.identity.githubUrl);
  });

  it("carries well-formed, non-negative github figures", () => {
    expect(Array.isArray(seedGitHub.contributions)).toBe(true);
    expect(seedGitHub.contributionCount).toBeGreaterThanOrEqual(0);
    expect(seedGitHub.repoCount).toBeGreaterThanOrEqual(0);
  });

  it("every baked commit is well-formed", () => {
    for (const commit of recentCommits) {
      expect(commit.hash).toMatch(/^[0-9a-f]+$/);
      expect(commit.message.length).toBeGreaterThan(0);
      expect(commit.url).toMatch(/^https:\/\/github\.com\//);
    }
  });

  it("bundles baked commits and the github summary into seedActivity", () => {
    expect(seedActivity.commits).toBe(recentCommits);
    expect(seedActivity.github).toBe(seedGitHub);
  });
});
