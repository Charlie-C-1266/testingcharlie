import { describe, expect, it } from "vitest";
import { renderBrand, renderNav, renderThemeToggle } from "../../../src/sections/nav.js";
import { siteConfig } from "../../../src/config.js";

describe("renderThemeToggle", () => {
  it("is a button with the test hook and the given initial label", () => {
    const button = renderThemeToggle(siteConfig.ui.themeToggle.toDark);
    expect(button.tagName).toBe("BUTTON");
    expect(button.getAttribute("type")).toBe("button");
    expect(button.getAttribute("data-testid")).toBe("theme-toggle");
    expect(button.textContent).toBe(siteConfig.ui.themeToggle.toDark);
    expect(button.getAttribute("aria-pressed")).toBe("false");
  });
});

describe("renderBrand", () => {
  it("shows the brand, faint tld and blinking cursor", () => {
    const brand = renderBrand(siteConfig.identity);
    expect(brand.textContent).toBe("testingcharlie.co.uk_");
    expect(brand.querySelector(".nav__brand-tld")?.textContent).toBe(".co.uk");
    expect(brand.querySelector(".nav__cursor")?.textContent).toBe("_");
  });
});

describe("renderNav", () => {
  it("renders the status, links, toggle and contact chip", () => {
    const nav = renderNav(siteConfig);
    expect(nav.tagName).toBe("HEADER");
    expect(nav.querySelector(".status")?.textContent).toContain("build: passing");
    expect(nav.querySelectorAll(".nav__link")).toHaveLength(siteConfig.nav.length);
    expect(nav.querySelector('[data-testid="theme-toggle"]')).not.toBeNull();

    const contact = nav.querySelector(".chip");
    expect(contact?.getAttribute("href")).toBe(`mailto:${siteConfig.identity.email}`);
    expect(contact?.textContent).toBe(siteConfig.ui.contactCta);
  });
});
