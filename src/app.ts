import type { DataSource } from "./data-source.js";
import type { ThemeController } from "./theme.js";
import type { ActivityData, SiteConfig } from "./types.js";
import { renderActivity } from "./sections/activity.js";
import { renderFeatured } from "./sections/featured.js";
import { renderFooter } from "./sections/footer.js";
import { updateCommitList } from "./sections/git-log.js";
import { updateGitHubPanel } from "./sections/github-panel.js";
import { renderHero } from "./sections/hero.js";
import { renderMarquee } from "./sections/marquee.js";
import { renderNav } from "./sections/nav.js";
import { renderWork } from "./sections/work.js";
import { renderWriting } from "./sections/writing.js";

/** Build every section, top-to-bottom, from config + initial activity data. */
export function renderPage(config: SiteConfig, data: ActivityData): HTMLElement[] {
  return [
    renderNav(config),
    renderHero(config),
    renderMarquee(config.marqueeKeywords),
    renderFeatured(config.featured),
    renderActivity(config, data),
    renderWork(config.work, config.ui),
    renderWriting(config.posts, config.ui),
    renderFooter(config),
  ];
}

/** Swap seed content in the recent-activity section for freshly hydrated data. */
export function applyLiveData(root: ParentNode, data: ActivityData): void {
  const commitList = root.querySelector('[data-testid="commit-list"]');
  if (commitList) {
    updateCommitList(commitList, data.commits);
  }
  const githubPanel = root.querySelector('[data-testid="github-panel"]');
  if (githubPanel) {
    updateGitHubPanel(githubPanel, data.github);
  }
}

/** Everything {@link mountApp} needs, injected so the wiring stays testable. */
export interface MountOptions {
  root: HTMLElement;
  config: SiteConfig;
  dataSource: DataSource;
  theme: ThemeController;
}

/**
 * Render the page from seed data for an instant first paint, wire the theme
 * toggle, then hydrate the live panels in the background. The returned
 * `hydrated` promise resolves once hydration has been applied (or safely
 * swallowed) — handy for tests.
 */
export function mountApp(options: MountOptions): { hydrated: Promise<void> } {
  const { root, config, dataSource, theme } = options;

  root.classList.add("app");
  root.replaceChildren(...renderPage(config, dataSource.initial()));

  theme.init();
  const toggle = root.querySelector<HTMLButtonElement>('[data-testid="theme-toggle"]');
  if (toggle) {
    theme.bindToggle(toggle);
  }

  const hydrated = dataSource
    .hydrate()
    .then((live) => applyLiveData(root, live))
    .catch(() => {
      // Keep the seed render on any failure — the page is already complete.
    });

  return { hydrated };
}
