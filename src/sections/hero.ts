import { el, linkTo, multiline } from "../dom.js";
import type { ContactChip, SiteConfig } from "../types.js";
import { renderPipeline } from "./pipeline.js";

/** Hero H1: the title lines with a trailing accent full-stop. */
export function renderHeroTitle(lines: string[]): HTMLHeadingElement {
  return el("h1", {
    class: "hero__title",
    children: [
      ...multiline(lines),
      el("span", { class: "hero__title-dot", text: ".", attrs: { "aria-hidden": "true" } }),
    ],
  });
}

/** A hero contact chip; off-site links open in a new tab. */
export function renderHeroChip(chip: ContactChip): HTMLAnchorElement {
  return linkTo(chip.href, "chip", [chip.label]);
}

/** Hero (section 2): intro text on the left, pipeline panel on the right. */
export function renderHero(config: SiteConfig): HTMLElement {
  const { hero, pipeline } = config;

  const left = el("div", {
    children: [
      el("p", { class: "hero__kicker", text: hero.kicker }),
      renderHeroTitle(hero.titleLines),
      el("p", { class: "hero__lead", text: hero.lead }),
      el("div", { class: "hero__chips", children: hero.chips.map(renderHeroChip) }),
    ],
  });

  return el("section", {
    class: "hero",
    attrs: { id: "about", "aria-label": "Introduction" },
    children: [left, renderPipeline(pipeline, config.ui)],
  });
}
