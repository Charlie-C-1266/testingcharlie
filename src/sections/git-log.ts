import { el, linkTo, replaceChildren } from "../dom.js";
import type { Commit, Identity } from "../types.js";
import { trafficLights } from "./chrome.js";

/** A single commit row: short hash · message · relative time. */
export function renderCommitRow(commit: Commit): HTMLElement {
  const children = [
    el("span", { class: "commit__hash", text: commit.hash }),
    el("span", { class: "commit__msg", text: commit.message }),
    el("span", { class: "commit__time", text: commit.relativeTime }),
  ];
  const label = `${commit.hash} ${commit.message}, ${commit.relativeTime}`;
  return linkTo(commit.url ?? "#", "commit", children, { "aria-label": label });
}

/** The scrolling body of the terminal holding all commit rows. */
export function renderCommitList(commits: Commit[]): HTMLElement {
  return el("div", {
    class: "terminal__body",
    attrs: { "data-testid": "commit-list" },
    children: commits.map(renderCommitRow),
  });
}

/** Re-render an existing commit list in place (used after live hydration). */
export function updateCommitList(list: Element, commits: Commit[]): void {
  replaceChildren(list, commits.map(renderCommitRow));
}

/** git-log terminal card: chrome bar + `git log --oneline` output. */
export function renderTerminal(identity: Identity, commits: Commit[]): HTMLElement {
  const bar = el("div", {
    class: "terminal__bar",
    children: [
      ...trafficLights(),
      el("span", {
        class: "terminal__title",
        text: `${identity.shellUser}@${identity.shellHost}: git log --oneline`,
      }),
      el("span", { class: "terminal__branch", text: "main ✓" }),
    ],
  });

  return el("div", { class: "terminal", children: [bar, renderCommitList(commits)] });
}
