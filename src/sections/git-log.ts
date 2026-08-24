import { el, linkTo, replaceChildren } from "../dom.js";
import { relativeTime } from "../time.js";
import type { Commit, Identity, UiLabels } from "../types.js";
import { trafficLights } from "./chrome.js";

/**
 * A single commit row: short hash · message · relative time. The age is
 * derived from the commit's ISO timestamp against `now` on every render, so the
 * displayed age stays honest however long ago the page was built.
 */
export function renderCommitRow(commit: Commit, now: Date = new Date()): HTMLElement {
  const age = relativeTime(new Date(commit.dateIso), now);
  const children = [
    el("span", { class: "commit__hash", text: commit.hash }),
    el("span", { class: "commit__msg", text: commit.message }),
    el("span", { class: "commit__time", text: age }),
  ];
  const label = `${commit.hash} ${commit.message}, ${age}`;
  return linkTo(commit.url ?? "#", "commit", children, { "aria-label": label });
}

/** The scrolling body of the terminal holding all commit rows. */
export function renderCommitList(commits: Commit[], now: Date = new Date()): HTMLElement {
  return el("div", {
    class: "terminal__body",
    attrs: { "data-testid": "commit-list" },
    children: commits.map((commit) => renderCommitRow(commit, now)),
  });
}

/** Re-render an existing commit list in place (used after live hydration). */
export function updateCommitList(list: Element, commits: Commit[], now: Date = new Date()): void {
  replaceChildren(
    list,
    commits.map((commit) => renderCommitRow(commit, now)),
  );
}

/** git-log terminal card: chrome bar + `git log --oneline` output. */
export function renderTerminal(
  identity: Identity,
  commits: Commit[],
  ui: UiLabels,
  now: Date = new Date(),
): HTMLElement {
  const bar = el("div", {
    class: "terminal__bar",
    children: [
      ...trafficLights(),
      el("span", {
        class: "terminal__title",
        text: `${identity.shellUser}@${identity.shellHost}: ${ui.terminal.command}`,
      }),
      el("span", { class: "terminal__branch", text: ui.terminal.branch }),
    ],
  });

  return el("div", { class: "terminal", children: [bar, renderCommitList(commits, now)] });
}
