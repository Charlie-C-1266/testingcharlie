import { describe, expect, it, vi } from "vitest";
import { applyLiveData, mountApp, renderPage } from "../../src/app.js";
import type { DataSource } from "../../src/data-source.js";
import { ThemeController } from "../../src/theme.js";
import { siteConfig } from "../../src/config.js";
import { seedActivity } from "../../src/seed.js";
import type { ActivityData } from "../../src/types.js";
import { fakeMedia, MemoryStorage } from "./helpers.js";

const liveData: ActivityData = {
  commits: [{ hash: "live99", message: "live: hydrated", relativeTime: "5m ago" }],
  github: { ...seedActivity.github, repoCount: 99, profileUrl: "https://github.com/live" },
};

function makeTheme(): ThemeController {
  return new ThemeController({
    labels: siteConfig.ui.themeToggle,
    root: document.documentElement,
    storage: new MemoryStorage(),
    media: fakeMedia(false),
  });
}

function fixedSource(overrides: Partial<DataSource> = {}): DataSource {
  return {
    initial: () => seedActivity,
    hydrate: async () => liveData,
    ...overrides,
  };
}

describe("renderPage", () => {
  it("builds all eight sections in order", () => {
    const sections = renderPage(siteConfig, seedActivity);
    expect(sections).toHaveLength(8);
    expect(sections[0]?.tagName).toBe("HEADER");
    expect(sections.at(-1)?.tagName).toBe("FOOTER");
  });
});

describe("applyLiveData", () => {
  it("updates the commit list and github panel in a rendered page", () => {
    const host = document.createElement("div");
    host.append(...renderPage(siteConfig, seedActivity));
    applyLiveData(host, liveData);

    expect(host.querySelector(".commit__hash")?.textContent).toBe("live99");
    // Caption wording depends on whether a contribution total is baked, so just
    // assert the hydrated repo count (99) is reflected.
    expect(host.querySelector('[data-testid="github-caption"]')?.textContent).toContain("99");
  });

  it("is a no-op when the activity nodes are absent", () => {
    const host = document.createElement("div");
    expect(() => applyLiveData(host, liveData)).not.toThrow();
  });
});

describe("mountApp", () => {
  it("renders the page, applies the theme and binds the toggle", async () => {
    const root = document.createElement("div");
    const theme = makeTheme();
    const { hydrated } = mountApp({ root, config: siteConfig, dataSource: fixedSource(), theme });

    expect(root.classList.contains("app")).toBe(true);
    expect(root.querySelector("header.nav")).not.toBeNull();
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    const toggle = root.querySelector<HTMLButtonElement>('[data-testid="theme-toggle"]');
    toggle?.click();
    expect(theme.theme).toBe("dark");

    await hydrated;
    expect(root.querySelector(".commit__hash")?.textContent).toBe("live99");
  });

  it("keeps the seed render when hydration rejects", async () => {
    const root = document.createElement("div");
    const source = fixedSource({ hydrate: async () => Promise.reject(new Error("offline")) });
    const { hydrated } = mountApp({ root, config: siteConfig, dataSource: source, theme: makeTheme() });

    await expect(hydrated).resolves.toBeUndefined();
    const seedHash = seedActivity.commits[0]?.hash;
    expect(root.querySelector(".commit__hash")?.textContent).toBe(seedHash);
  });

  it("reports a hydration failure through reportError (still keeping the seed)", async () => {
    const root = document.createElement("div");
    const boom = new Error("rate limited");
    const reportError = vi.fn();
    const source = fixedSource({ hydrate: async () => Promise.reject(boom) });
    const { hydrated } = mountApp({
      root,
      config: siteConfig,
      dataSource: source,
      theme: makeTheme(),
      reportError,
    });

    await expect(hydrated).resolves.toBeUndefined();
    expect(reportError).toHaveBeenCalledWith("hydrate", boom);
    expect(root.querySelector(".commit__hash")?.textContent).toBe(seedActivity.commits[0]?.hash);
  });
});
