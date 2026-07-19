import { afterEach, describe, expect, it } from "vitest";
import { THEME_STORAGE_KEY, ThemeController, toggleLabel } from "../../src/theme.js";
import { siteConfig } from "../../src/config.js";
import { fakeMedia, MemoryStorage, throwingStorage } from "./helpers.js";

// The controller now takes its button labels from config; the tests inject the
// real ones so behaviour and copy stay in step with the live site.
const labels = siteConfig.ui.themeToggle;

function makeRoot(): HTMLElement {
  return document.createElement("div");
}

describe("toggleLabel", () => {
  it("describes the action the button performs", () => {
    expect(toggleLabel("light", labels)).toBe(labels.toDark);
    expect(toggleLabel("dark", labels)).toBe(labels.toLight);
  });
});

describe("ThemeController.resolveInitial", () => {
  it("prefers a valid stored choice", () => {
    const storage = new MemoryStorage();
    storage.setItem(THEME_STORAGE_KEY, "dark");
    const controller = new ThemeController({ labels, root: makeRoot(), storage, media: fakeMedia(false) });
    expect(controller.resolveInitial()).toBe("dark");
  });

  it("ignores an invalid stored value and falls back to the OS preference", () => {
    const storage = new MemoryStorage();
    storage.setItem(THEME_STORAGE_KEY, "purple");
    const dark = new ThemeController({ labels, root: makeRoot(), storage, media: fakeMedia(true) });
    expect(dark.resolveInitial()).toBe("dark");

    const light = new ThemeController({ labels, root: makeRoot(), storage, media: fakeMedia(false) });
    expect(light.resolveInitial()).toBe("light");
  });

  it("defaults to light when no media query is available", () => {
    const controller = new ThemeController({ labels, root: makeRoot(), storage: new MemoryStorage(), media: undefined });
    expect(controller.resolveInitial()).toBe("light");
  });

  it("survives a throwing storage by falling back to media", () => {
    const controller = new ThemeController({ labels, root: makeRoot(), storage: throwingStorage, media: fakeMedia(true) });
    expect(controller.resolveInitial()).toBe("dark");
  });
});

describe("ThemeController state", () => {
  it("init applies the resolved theme to the root without persisting", () => {
    const root = makeRoot();
    const storage = new MemoryStorage();
    const controller = new ThemeController({ labels, root, storage, media: fakeMedia(true) });
    expect(controller.init()).toBe("dark");
    expect(root.getAttribute("data-theme")).toBe("dark");
    expect(storage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it("set applies and persists", () => {
    const root = makeRoot();
    const storage = new MemoryStorage();
    const controller = new ThemeController({ labels, root, storage, media: fakeMedia(false) });
    controller.set("dark");
    expect(controller.theme).toBe("dark");
    expect(root.getAttribute("data-theme")).toBe("dark");
    expect(storage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("toggle flips between themes", () => {
    const controller = new ThemeController({ labels, root: makeRoot(), storage: new MemoryStorage(), media: fakeMedia(false) });
    controller.init();
    expect(controller.toggle()).toBe("dark");
    expect(controller.toggle()).toBe("light");
  });

  it("swallows persistence errors on set", () => {
    const root = makeRoot();
    const controller = new ThemeController({ labels, root, storage: throwingStorage, media: fakeMedia(false) });
    expect(() => controller.set("dark")).not.toThrow();
    expect(root.getAttribute("data-theme")).toBe("dark");
  });
});

describe("ThemeController.bindToggle", () => {
  it("syncs the button label and toggles on click", () => {
    const root = makeRoot();
    const controller = new ThemeController({ labels, root, storage: new MemoryStorage(), media: fakeMedia(false) });
    controller.init();

    const button = document.createElement("button");
    controller.bindToggle(button);
    expect(button.textContent).toBe(labels.toDark);
    expect(button.getAttribute("aria-pressed")).toBe("false");

    button.click();
    expect(controller.theme).toBe("dark");
    expect(button.textContent).toBe(labels.toLight);
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(button.getAttribute("aria-label")).toBe("Switch to light theme");
  });
});

describe("ThemeController default dependencies", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    if (originalMatchMedia) {
      window.matchMedia = originalMatchMedia;
    } else {
      Reflect.deleteProperty(window, "matchMedia");
    }
    window.localStorage.clear();
  });

  it("reads localStorage and a missing matchMedia defaults to light", () => {
    Reflect.deleteProperty(window, "matchMedia");
    const controller = new ThemeController({ labels });
    expect(controller.resolveInitial()).toBe("light");
  });

  it("uses window.matchMedia when present", () => {
    window.matchMedia = ((): MediaQueryList => fakeMedia(true)) as typeof window.matchMedia;
    const controller = new ThemeController({ labels });
    expect(controller.resolveInitial()).toBe("dark");
  });
});
