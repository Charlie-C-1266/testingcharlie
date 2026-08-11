import { el } from "../dom.js";
import type { ElChild } from "../dom.js";
import type { AboutContent, AboutHighlight } from "../types.js";

/** One highlight row: a `<dt>` term followed by its `<dd>` detail. */
export function renderAboutHighlight(item: AboutHighlight): HTMLElement[] {
  return [el("dt", { class: "about__term", text: item.term }), el("dd", { class: "about__detail", text: item.detail })];
}

/** About band: the short bio + labelled highlights that the nav "about" targets. */
export function renderAbout(about: AboutContent, prompt: string): HTMLElement {
  const lead: ElChild[] = about.lead.map((para) => el("p", { class: "about__lead", text: para }));

  const body = el("div", {
    class: "about__body",
    children: [el("h2", { class: "about__title", text: about.heading }), ...lead],
  });

  const highlights = el("dl", {
    class: "about__highlights",
    children: about.highlights.flatMap(renderAboutHighlight),
  });

  return el("section", {
    class: "about",
    attrs: { id: "about", "aria-label": "About" },
    children: [
      el("div", { class: "prompt", text: prompt }),
      el("div", { class: "about__grid", children: [body, highlights] }),
    ],
  });
}
