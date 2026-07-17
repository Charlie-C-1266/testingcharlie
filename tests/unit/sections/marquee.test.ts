import { describe, expect, it } from "vitest";
import { renderMarquee, renderMarqueeItem } from "../../../src/sections/marquee.js";

describe("renderMarqueeItem", () => {
  it("shows the keyword and a separator glyph", () => {
    const item = renderMarqueeItem("playwright");
    expect(item.textContent).toBe("playwright✓");
    expect(item.querySelector(".marquee__sep")?.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("renderMarquee", () => {
  const keywords = ["a", "b", "c"];

  it("duplicates the keyword list for a seamless loop", () => {
    const marquee = renderMarquee(keywords);
    const track = marquee.querySelector('[data-testid="marquee-track"]');
    expect(track?.querySelectorAll(".marquee__item")).toHaveLength(keywords.length * 2);
  });

  it("is hidden from assistive tech", () => {
    const marquee = renderMarquee(keywords);
    expect(marquee.getAttribute("aria-hidden")).toBe("true");
  });
});
