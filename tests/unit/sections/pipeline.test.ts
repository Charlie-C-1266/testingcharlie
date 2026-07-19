import { describe, expect, it } from "vitest";
import { renderPipeline, renderStat } from "../../../src/sections/pipeline.js";
import { siteConfig } from "../../../src/config.js";

describe("renderStat", () => {
  it("emphasises the accent number when requested", () => {
    const plain = renderStat({ value: "214", label: "tests" });
    expect(plain.querySelector(".stat__num")?.className).toBe("stat__num");

    const accent = renderStat({ value: "0.2%", label: "flake rate", emphasis: true });
    expect(accent.querySelector(".stat__num")?.className).toContain("stat__num--accent");
  });
});

describe("renderPipeline", () => {
  it("renders one pass pill per stage with separators between", () => {
    const panel = renderPipeline(siteConfig.pipeline, siteConfig.ui);
    const stages = siteConfig.pipeline.stages;
    expect(panel.querySelectorAll(".pipeline__stages .pass")).toHaveLength(stages.length);
    expect(panel.querySelectorAll(".pipeline__sep")).toHaveLength(stages.length - 1);
    expect(panel.querySelector(".pipeline__head")?.textContent).toContain(siteConfig.ui.pipeline.title);
  });

  it("renders every stat cell", () => {
    const panel = renderPipeline(siteConfig.pipeline, siteConfig.ui);
    expect(panel.querySelectorAll(".pipeline__stats .stat")).toHaveLength(siteConfig.pipeline.stats.length);
  });
});
