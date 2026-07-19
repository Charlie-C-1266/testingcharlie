import type { Theme, ThemeToggleLabels } from "./types.js";

/** localStorage key holding the user's explicit theme choice. */
export const THEME_STORAGE_KEY = "tc-theme";

/** Dependencies for {@link ThemeController}, all injectable for testing. */
export interface ThemeControllerOptions {
  /** Button labels for each theme state (authored in siteConfig.ui.themeToggle). */
  labels: ThemeToggleLabels;
  /** Element carrying the `data-theme` attribute (default: <html>). */
  root?: HTMLElement;
  /** Persistence for the chosen theme (default: window.localStorage). */
  storage?: Storage | undefined;
  /** `(prefers-color-scheme: dark)` query (default: from window.matchMedia). */
  media?: MediaQueryList | undefined;
}

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

/** Resolve the default storage, tolerating environments where it throws. */
function defaultStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

/** Resolve the default colour-scheme media query, if the browser supports it. */
function defaultMedia(): MediaQueryList | undefined {
  if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    return window.matchMedia("(prefers-color-scheme: dark)");
  }
  return undefined;
}

/** Visible label for the toggle in a given theme, describing the action it performs. */
export function toggleLabel(theme: Theme, labels: ThemeToggleLabels): string {
  return theme === "dark" ? labels.toLight : labels.toDark;
}

/**
 * Owns the single piece of UI state — the theme — and keeps the DOM, any bound
 * toggle buttons, and persistence in sync. All side-effect surfaces (root,
 * storage, media) are injected so the controller is trivially unit-testable.
 */
export class ThemeController {
  private readonly root: HTMLElement;
  private readonly storage: Storage | undefined;
  private readonly media: MediaQueryList | undefined;
  private readonly labels: ThemeToggleLabels;
  private readonly toggles = new Set<HTMLButtonElement>();
  private current: Theme = "light";

  constructor(options: ThemeControllerOptions) {
    this.labels = options.labels;
    this.root = options.root ?? document.documentElement;
    this.storage = "storage" in options ? options.storage : defaultStorage();
    this.media = "media" in options ? options.media : defaultMedia();
  }

  /** The currently applied theme. */
  get theme(): Theme {
    return this.current;
  }

  /** Read the persisted choice, or fall back to the OS preference. */
  resolveInitial(): Theme {
    const stored = this.readStored();
    if (stored) {
      return stored;
    }
    return this.media?.matches ? "dark" : "light";
  }

  /** Resolve and apply the initial theme. Call once on load. */
  init(): Theme {
    this.apply(this.resolveInitial(), false);
    return this.current;
  }

  /** Set the theme explicitly, persisting the choice. */
  set(theme: Theme): void {
    this.apply(theme, true);
  }

  /** Flip between light and dark, returning the new theme. */
  toggle(): Theme {
    this.set(this.current === "dark" ? "light" : "dark");
    return this.current;
  }

  /** Wire a toggle button: clicking flips the theme; its label stays in sync. */
  bindToggle(button: HTMLButtonElement): void {
    this.toggles.add(button);
    button.addEventListener("click", () => this.toggle());
    this.syncToggle(button);
  }

  private apply(theme: Theme, persist: boolean): void {
    this.current = theme;
    this.root.setAttribute("data-theme", theme);
    if (persist) {
      this.writeStored(theme);
    }
    for (const button of this.toggles) {
      this.syncToggle(button);
    }
  }

  private syncToggle(button: HTMLButtonElement): void {
    const label = toggleLabel(this.current, this.labels);
    button.textContent = label;
    button.setAttribute("aria-label", `Switch to ${this.current === "dark" ? "light" : "dark"} theme`);
    button.setAttribute("aria-pressed", String(this.current === "dark"));
  }

  private readStored(): Theme | null {
    try {
      const value = this.storage?.getItem(THEME_STORAGE_KEY);
      return isTheme(value) ? value : null;
    } catch {
      return null;
    }
  }

  private writeStored(theme: Theme): void {
    try {
      this.storage?.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Persistence is best-effort (e.g. Safari private mode throws).
    }
  }
}
