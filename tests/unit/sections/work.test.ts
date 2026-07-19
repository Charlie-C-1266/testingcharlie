import { describe, expect, it } from "vitest";
import { renderWork, renderWorkCard } from "../../../src/sections/work.js";
import { siteConfig } from "../../../src/config.js";
import type { WorkProject } from "../../../src/types.js";

const passing: WorkProject = {
  name: "Sentinel",
  description: "Quarantines flaky specs.",
  meta: "Node · Playwright · 2024",
  url: "https://github.com/x/sentinel",
  passing: true,
};

describe("renderWorkCard", () => {
  it("shows a passing pill and an external link", () => {
    const card = renderWorkCard(passing, siteConfig.ui.passing);
    expect(card.getAttribute("target")).toBe("_blank");
    expect(card.getAttribute("aria-label")).toBe("Sentinel — Node · Playwright · 2024");
    expect(card.querySelector(".pass--sm")?.textContent).toBe(`✓ ${siteConfig.ui.passing}`);
    expect(card.querySelector(".project-card__title")?.textContent).toBe("Sentinel");
  });

  it("omits the passing pill when not passing", () => {
    const card = renderWorkCard({ ...passing, passing: false }, siteConfig.ui.passing);
    expect(card.querySelector(".pass--sm")).toBeNull();
  });
});

describe("renderWork", () => {
  it("is the #work section with a card per project", () => {
    const work = renderWork(siteConfig.work, siteConfig.ui);
    expect(work.getAttribute("id")).toBe("work");
    expect(work.querySelector(".prompt")?.textContent).toBe(siteConfig.ui.prompts.moreWork);
    expect(work.querySelectorAll(".project-card")).toHaveLength(siteConfig.work.length);
  });
});
