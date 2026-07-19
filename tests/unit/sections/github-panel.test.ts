import { describe, expect, it } from "vitest";
import {
  contributionSummary,
  renderCell,
  renderGitHubPanel,
  renderHeatmap,
  updateGitHubPanel,
} from "../../../src/sections/github-panel.js";
import { siteConfig } from "../../../src/config.js";
import type { GitHubSummary } from "../../../src/types.js";

const summary: GitHubSummary = {
  handle: "@testingcharlie",
  profileUrl: "https://github.com/Charlie-C-1266",
  contributions: [
    { level: 0, count: 0 },
    { level: 3, count: 7, date: "2026-07-01" },
  ],
  contributionCount: 1204,
  repoCount: 34,
};

describe("contributionSummary", () => {
  it("formats the count with grouping and the repo tally", () => {
    expect(contributionSummary(summary)).toBe("1,204 contributions in the last year · 34 repos");
  });

  it("omits a zero/unpopulated contribution count, showing only repos", () => {
    expect(contributionSummary({ ...summary, contributionCount: 0 })).toBe("34 public repos");
  });
});

describe("renderCell", () => {
  it("uses the base class for empty cells", () => {
    const cell = renderCell({ level: 0, count: 0 });
    expect(cell.className).toBe("heatmap__cell");
    expect(cell.getAttribute("title")).toBe("0 contributions");
  });

  it("adds the level modifier and a dated title", () => {
    const cell = renderCell({ level: 3, count: 7, date: "2026-07-01" });
    expect(cell.className).toContain("heatmap__cell--l3");
    expect(cell.getAttribute("title")).toBe("7 on 2026-07-01");
  });
});

describe("renderHeatmap", () => {
  it("renders every cell and hides itself from assistive tech", () => {
    const heatmap = renderHeatmap(summary.contributions);
    expect(heatmap.getAttribute("aria-hidden")).toBe("true");
    expect(heatmap.querySelectorAll(".heatmap__cell")).toHaveLength(2);
    expect(heatmap.classList.contains("heatmap--empty")).toBe(false);
  });

  it("collapses via heatmap--empty when there are no cells", () => {
    const heatmap = renderHeatmap([]);
    expect(heatmap.classList.contains("heatmap--empty")).toBe(true);
    expect(heatmap.querySelectorAll(".heatmap__cell")).toHaveLength(0);
  });
});

describe("renderGitHubPanel", () => {
  it("wires the handle, caption and profile link", () => {
    const panel = renderGitHubPanel(summary, siteConfig.ui);
    expect(panel.querySelector('[data-testid="github-handle"]')?.textContent).toBe("@testingcharlie");
    expect(panel.querySelector('[data-testid="github-caption"]')?.textContent).toContain("1,204 contributions");
    const link = panel.querySelector('[data-testid="github-link"]');
    expect(link?.getAttribute("href")).toBe(summary.profileUrl);
    expect(link?.getAttribute("target")).toBe("_blank");
    expect(link?.textContent).toBe(siteConfig.ui.github.profileLink);
    expect(panel.querySelector(".github__head")?.textContent).toContain(siteConfig.ui.github.title);
  });
});

describe("updateGitHubPanel", () => {
  it("refreshes handle, heatmap, caption and link in a mounted panel", () => {
    const panel = renderGitHubPanel(summary, siteConfig.ui);
    const next: GitHubSummary = {
      ...summary,
      handle: "@charlie",
      profileUrl: "https://github.com/charlie",
      repoCount: 40,
      contributions: [{ level: 1, count: 1 }],
    };
    updateGitHubPanel(panel, next);

    expect(panel.querySelector('[data-testid="github-handle"]')?.textContent).toBe("@charlie");
    expect(panel.querySelector('[data-testid="github-caption"]')?.textContent).toContain("· 40 repos");
    expect(panel.querySelectorAll(".heatmap__cell")).toHaveLength(1);
    expect(panel.querySelector('[data-testid="github-link"]')?.getAttribute("href")).toBe("https://github.com/charlie");
  });

  it("collapses the heatmap when hydrated data has no contributions", () => {
    const panel = renderGitHubPanel(summary, siteConfig.ui);
    updateGitHubPanel(panel, { ...summary, contributionCount: 0, contributions: [] });
    const heatmap = panel.querySelector('[data-testid="heatmap"]');
    expect(heatmap?.classList.contains("heatmap--empty")).toBe(true);
    expect(panel.querySelector('[data-testid="github-caption"]')?.textContent).toBe("34 public repos");
  });

  it("is a safe no-op when the panel lacks the expected nodes", () => {
    const bare = document.createElement("div");
    expect(() => updateGitHubPanel(bare, summary)).not.toThrow();
  });
});
