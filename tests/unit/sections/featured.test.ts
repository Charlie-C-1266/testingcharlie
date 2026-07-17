import { describe, expect, it } from "vitest";
import { renderBrowser, renderFeatured } from "../../../src/sections/featured.js";
import { trafficLights } from "../../../src/sections/chrome.js";
import { siteConfig } from "../../../src/config.js";
import type { FeaturedProject } from "../../../src/types.js";

describe("trafficLights", () => {
  it("returns the three coloured dots", () => {
    const dots = trafficLights();
    expect(dots.map((dot) => dot.className)).toEqual(["dot dot--red", "dot dot--amber", "dot dot--green"]);
  });
});

describe("renderBrowser", () => {
  it("shows the striped placeholder label when no screenshot is set", () => {
    const browser = renderBrowser(siteConfig.featured);
    expect(browser.querySelector(".browser__shot-label")?.textContent).toBe(siteConfig.featured.screenshot.placeholder);
    expect(browser.querySelector("img")).toBeNull();
  });

  it("shows a real image when a src is provided", () => {
    const withShot: FeaturedProject = {
      ...siteConfig.featured,
      screenshot: { src: "/shot.png", alt: "A screenshot", placeholder: "unused" },
    };
    const img = renderBrowser(withShot).querySelector("img");
    expect(img?.getAttribute("src")).toBe("/shot.png");
    expect(img?.getAttribute("alt")).toBe("A screenshot");
  });
});

describe("renderFeatured", () => {
  it("renders check-prefixed pills and an external project link", () => {
    const featured = renderFeatured(siteConfig.featured);
    const pills = featured.querySelectorAll(".featured__pills .pass");
    expect(pills).toHaveLength(siteConfig.featured.pills.length);
    expect(pills[0]?.textContent).toBe(`✓ ${siteConfig.featured.pills[0]}`);

    const link = featured.querySelector(".link");
    expect(link?.getAttribute("href")).toBe(siteConfig.featured.url);
    expect(link?.getAttribute("target")).toBe("_blank");
  });
});
