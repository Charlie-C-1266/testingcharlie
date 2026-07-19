import { el } from "../dom.js";
import type { ActivityData, SiteConfig } from "../types.js";
import { renderTerminal } from "./git-log.js";
import { renderGitHubPanel } from "./github-panel.js";

/** Recent-activity section (5): git-log terminal + GitHub panel side by side. */
export function renderActivity(config: SiteConfig, data: ActivityData): HTMLElement {
  const grid = el("div", {
    class: "activity__grid",
    children: [renderTerminal(config.identity, data.commits, config.ui), renderGitHubPanel(data.github, config.ui)],
  });

  return el("section", {
    class: "activity",
    attrs: { id: "activity", "aria-label": "Recent activity" },
    children: [el("div", { class: "prompt", text: config.ui.prompts.recentActivity }), grid],
  });
}
