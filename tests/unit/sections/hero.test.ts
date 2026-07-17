import { describe, expect, it } from "vitest";
import { renderHero, renderHeroChip, renderHeroTitle } from "../../../src/sections/hero.js";
import { siteConfig } from "../../../src/config.js";

describe("renderHeroTitle", () => {
  it("joins lines with <br> and ends with the accent dot", () => {
    const title = renderHeroTitle(["one", "two"]);
    expect(title.tagName).toBe("H1");
    expect(title.querySelectorAll("br")).toHaveLength(1);
    expect(title.querySelector(".hero__title-dot")?.textContent).toBe(".");
    expect(title.textContent).toBe("onetwo.");
  });
});

describe("renderHeroChip", () => {
  it("opens off-site chips in a new tab", () => {
    const chip = renderHeroChip({ label: "GitHub ↗", href: "https://github.com/x" });
    expect(chip.getAttribute("target")).toBe("_blank");
  });

  it("keeps mailto chips in place", () => {
    const chip = renderHeroChip({ label: "email", href: "mailto:a@b.com" });
    expect(chip.getAttribute("target")).toBeNull();
    expect(chip.getAttribute("href")).toBe("mailto:a@b.com");
  });
});

describe("renderHero", () => {
  it("is the #about section holding intro copy and the pipeline panel", () => {
    const hero = renderHero(siteConfig);
    expect(hero.getAttribute("id")).toBe("about");
    expect(hero.querySelector(".hero__kicker")?.textContent).toBe(siteConfig.hero.kicker);
    expect(hero.querySelectorAll(".hero__chips .chip")).toHaveLength(siteConfig.hero.chips.length);
    expect(hero.querySelector(".pipeline")).not.toBeNull();
  });
});
