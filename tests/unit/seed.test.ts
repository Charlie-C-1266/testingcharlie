import { describe, expect, it } from "vitest";
import { buildSeedContributions, seedActivity, seedCommits, seedGitHub } from "../../src/seed.js";
import { siteConfig } from "../../src/config.js";

describe("buildSeedContributions", () => {
  it("produces the requested number of cells with valid levels", () => {
    const cells = buildSeedContributions(105);
    expect(cells).toHaveLength(105);
    for (const cell of cells) {
      expect(cell.level).toBeGreaterThanOrEqual(0);
      expect(cell.level).toBeLessThanOrEqual(4);
      expect(cell.count).toBeGreaterThanOrEqual(0);
      if (cell.level === 0) {
        expect(cell.count).toBe(0);
      }
    }
  });

  it("is deterministic across calls", () => {
    expect(buildSeedContributions(20)).toEqual(buildSeedContributions(20));
  });

  it("defaults to 105 cells (7 rows × 15 weeks)", () => {
    expect(buildSeedContributions()).toHaveLength(105);
  });
});

describe("seed data", () => {
  it("exposes five placeholder commits", () => {
    expect(seedCommits).toHaveLength(5);
    expect(seedCommits[0]).toHaveProperty("hash");
  });

  it("derives the github summary from the site config", () => {
    expect(seedGitHub.handle).toBe(siteConfig.identity.githubHandle);
    expect(seedGitHub.profileUrl).toBe(siteConfig.identity.githubUrl);
    expect(seedGitHub.contributions.length).toBeGreaterThan(0);
  });

  it("bundles commits and github into seedActivity", () => {
    expect(seedActivity.commits).toBe(seedCommits);
    expect(seedActivity.github).toBe(seedGitHub);
  });
});
