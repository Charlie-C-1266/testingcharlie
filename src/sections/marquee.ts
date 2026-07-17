import { el } from "../dom.js";
import type { ElChild } from "../dom.js";

/** One marquee keyword followed by its green separator glyph. */
export function renderMarqueeItem(keyword: string): HTMLElement {
  return el("span", {
    class: "marquee__item",
    children: [keyword, el("span", { class: "marquee__sep", text: "✓", attrs: { "aria-hidden": "true" } })],
  });
}

/**
 * Marquee band (section 3). The keyword list is rendered twice back-to-back so
 * the -50% translate loops seamlessly. The whole strip is decorative, so it is
 * hidden from assistive tech.
 */
export function renderMarquee(keywords: string[]): HTMLElement {
  const once = keywords.map(renderMarqueeItem);
  const twice: ElChild[] = [...once, ...keywords.map(renderMarqueeItem)];

  const track = el("div", {
    class: "marquee__track",
    attrs: { "data-testid": "marquee-track" },
    children: twice,
  });

  return el("div", {
    class: "marquee",
    attrs: { role: "presentation", "aria-hidden": "true" },
    children: [track],
  });
}
