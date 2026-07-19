import { describe, expect, it } from "vitest";
import { renderComingSoon, renderPostRow, renderWriting } from "../../../src/sections/writing.js";
import { siteConfig } from "../../../src/config.js";
import type { Post } from "../../../src/types.js";

const post: Post = {
  title: "The flaky test lie",
  blurb: "Why just re-run it costs a day a week.",
  date: "Feb 2026",
  readingTime: "6 min",
  url: "#",
};

describe("renderPostRow", () => {
  it("renders the title, blurb and right-aligned meta", () => {
    const row = renderPostRow(post);
    expect(row.querySelector(".post__title")?.textContent).toBe(post.title);
    expect(row.querySelector(".post__blurb")?.textContent).toBe(post.blurb);
    expect(row.querySelector(".post__meta")?.textContent).toBe("Feb 20266 min");
    expect(row.getAttribute("aria-label")).toBe("The flaky test lie — Feb 2026, 6 min");
    expect(row.getAttribute("href")).toBe("#");
  });
});

describe("renderComingSoon", () => {
  it("renders the given empty-state label with a cursor", () => {
    const soon = renderComingSoon(siteConfig.ui.writingEmpty);
    expect(soon.className).toBe("writing__soon");
    expect(soon.textContent).toBe(`${siteConfig.ui.writingEmpty}_`);
    expect(soon.querySelector(".writing__cursor")?.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("renderWriting", () => {
  it("renders a row per post when posts exist", () => {
    const writing = renderWriting([post, { ...post, title: "Second" }], siteConfig.ui);
    expect(writing.getAttribute("id")).toBe("writing");
    expect(writing.querySelector(".prompt")?.textContent).toBe(siteConfig.ui.prompts.writing);
    expect(writing.querySelectorAll(".post")).toHaveLength(2);
    expect(writing.querySelector(".writing__soon")).toBeNull();
  });

  it("shows the empty-state placeholder when there are no posts", () => {
    const writing = renderWriting([], siteConfig.ui);
    expect(writing.querySelectorAll(".post")).toHaveLength(0);
    expect(writing.querySelector(".writing__soon")?.textContent).toContain(siteConfig.ui.writingEmpty);
  });
});
