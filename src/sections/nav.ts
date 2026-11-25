import { el } from "../dom.js";
import type { Identity, SiteConfig } from "../types.js";

/** Brand wordmark: `testingcharlie` + faint `.co.uk` + blinking cursor. */
export function renderBrand(identity: Identity): HTMLElement {
  return el("span", {
    class: "nav__brand",
    children: [
      identity.brand,
      el("span", { class: "nav__brand-tld", text: identity.brandTld }),
      el("span", { class: "nav__cursor", text: "_", attrs: { "aria-hidden": "true" } }),
    ],
  });
}

/**
 * The theme toggle button. `label` is the initial (light-mode) text; once
 * bound, ThemeController keeps the label in sync with the active theme.
 */
export function renderThemeToggle(label: string): HTMLButtonElement {
  return el("button", {
    class: "theme-toggle",
    text: label,
    attrs: {
      type: "button",
      "data-testid": "theme-toggle",
      "aria-label": "Switch to dark theme",
      "aria-pressed": "false",
    },
  });
}

/** Nav bar (section 1): brand on the left, links + toggle + contact. */
export function renderNav(config: SiteConfig): HTMLElement {
  const { identity, nav, ui } = config;

  const links = nav.map((item) => el("a", { class: "nav__link", text: item.label, attrs: { href: item.href } }));

  const contact = el("a", {
    class: "chip",
    text: ui.contactCta,
    attrs: { href: `mailto:${identity.email}` },
  });

  const right = el("nav", {
    class: "nav__links",
    attrs: { "aria-label": "Primary" },
    children: [...links, renderThemeToggle(ui.themeToggle.toDark), contact],
  });

  return el("header", { class: "nav", children: [renderBrand(identity), right] });
}
