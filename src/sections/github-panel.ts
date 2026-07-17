import { el, externalLink, replaceChildren } from "../dom.js";
import type { ContributionCell, GitHubSummary } from "../types.js";

/**
 * Caption line, e.g. "1,204 contributions in the last year · 34 repos". When
 * the contribution calendar isn't populated (no build token), the contribution
 * figure is omitted rather than shown as a misleading zero.
 */
export function contributionSummary(github: GitHubSummary): string {
  if (github.contributionCount > 0) {
    const contributions = github.contributionCount.toLocaleString("en-US");
    return `${contributions} contributions in the last year · ${github.repoCount} repos`;
  }
  return `${github.repoCount} public repos`;
}

/** A single heat cell; level 0 uses the base (empty) class. */
export function renderCell(cell: ContributionCell): HTMLElement {
  const className = cell.level === 0 ? "heatmap__cell" : `heatmap__cell heatmap__cell--l${cell.level}`;
  const title = cell.date ? `${cell.count} on ${cell.date}` : `${cell.count} contributions`;
  return el("span", { class: className, attrs: { title } });
}

/**
 * The 7-row contribution heat grid. Decorative → hidden from assistive tech.
 * Collapses (via `heatmap--empty`) when there are no cells, so an unpopulated
 * calendar leaves no empty gap.
 */
export function renderHeatmap(cells: ContributionCell[]): HTMLElement {
  return el("div", {
    class: cells.length === 0 ? "heatmap heatmap--empty" : "heatmap",
    attrs: { "data-testid": "heatmap", "aria-hidden": "true" },
    children: cells.map(renderCell),
  });
}

/** GitHub panel (section 5, right column). */
export function renderGitHubPanel(github: GitHubSummary): HTMLElement {
  const head = el("div", {
    class: "github__head",
    children: [
      el("span", { text: "github" }),
      el("span", { class: "github__handle", attrs: { "data-testid": "github-handle" }, text: github.handle }),
    ],
  });

  const caption = el("p", {
    class: "github__caption",
    attrs: { "data-testid": "github-caption" },
    text: contributionSummary(github),
  });

  const link = externalLink(github.profileUrl, "github__link", ["view profile →"], {
    "data-testid": "github-link",
  });

  return el("div", {
    class: "github",
    attrs: { "data-testid": "github-panel", "aria-label": "GitHub activity" },
    children: [head, renderHeatmap(github.contributions), caption, el("div", { class: "github__spacer" }), link],
  });
}

/** Update a mounted GitHub panel with fresh data (after live hydration). */
export function updateGitHubPanel(panel: Element, github: GitHubSummary): void {
  const handle = panel.querySelector('[data-testid="github-handle"]');
  if (handle) {
    handle.textContent = github.handle;
  }

  const heatmap = panel.querySelector('[data-testid="heatmap"]');
  if (heatmap) {
    replaceChildren(heatmap, github.contributions.map(renderCell));
    heatmap.classList.toggle("heatmap--empty", github.contributions.length === 0);
  }

  const caption = panel.querySelector('[data-testid="github-caption"]');
  if (caption) {
    caption.textContent = contributionSummary(github);
  }

  const link = panel.querySelector('[data-testid="github-link"]');
  if (link) {
    link.setAttribute("href", github.profileUrl);
  }
}
