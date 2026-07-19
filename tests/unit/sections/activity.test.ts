import { describe, expect, it } from "vitest";
import { renderActivity } from "../../../src/sections/activity.js";
import { siteConfig } from "../../../src/config.js";
import { seedActivity } from "../../../src/seed.js";

describe("renderActivity", () => {
  it("is the #activity section with prompt, terminal and github panel", () => {
    const activity = renderActivity(siteConfig, seedActivity);
    expect(activity.getAttribute("id")).toBe("activity");
    expect(activity.querySelector(".prompt")?.textContent).toBe(siteConfig.ui.prompts.recentActivity);
    expect(activity.querySelector('[data-testid="commit-list"]')).not.toBeNull();
    expect(activity.querySelector('[data-testid="github-panel"]')).not.toBeNull();
    expect(activity.querySelectorAll(".commit")).toHaveLength(seedActivity.commits.length);
  });
});
