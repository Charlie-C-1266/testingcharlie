import { el, linkTo, multiline } from "../dom.js";
import type { FeaturedProject } from "../types.js";
import { trafficLights } from "./chrome.js";

/** Browser mockup: chrome bar + striped placeholder (or a real screenshot). */
export function renderBrowser(featured: FeaturedProject): HTMLElement {
  const bar = el("div", {
    class: "browser__bar",
    children: [
      ...trafficLights(),
      el("span", { class: "browser__url", text: featured.urlLabel }),
      el("span", {
        class: "browser__status",
        children: [el("span", { class: "status-dot", attrs: { "aria-hidden": "true" } }), featured.ciLabel],
      }),
    ],
  });

  const { screenshot } = featured;
  const body = el("div", {
    class: "browser__body",
    children: screenshot.src
      ? [
          el("img", {
            class: "browser__shot",
            attrs: { src: screenshot.src, alt: screenshot.alt, loading: "lazy" },
          }),
        ]
      : [el("span", { class: "browser__shot-label", text: screenshot.placeholder })],
  });

  return el("div", { class: "browser", children: [bar, body] });
}

/** Featured band (section 4): project copy on the left, mockup on the right. */
export function renderFeatured(featured: FeaturedProject): HTMLElement {
  const pills = featured.pills.map((pill) => el("span", { class: "pass pass--md", text: `✓ ${pill}` }));

  const left = el("div", {
    children: [
      el("div", { class: "prompt", text: featured.prompt }),
      el("h2", { class: "featured__title", children: multiline(featured.titleLines) }),
      el("p", { class: "featured__body", text: featured.body }),
      el("div", { class: "featured__pills", children: pills }),
      el("div", {
        class: "featured__actions",
        children: [
          linkTo(featured.url, "link", [featured.actionLabel]),
          el("span", { class: "featured__meta", text: featured.meta }),
        ],
      }),
    ],
  });

  return el("section", {
    class: "featured",
    attrs: { "aria-label": "Featured project" },
    children: [left, renderBrowser(featured)],
  });
}
