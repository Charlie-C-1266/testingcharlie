import { el } from "../dom.js";
import type { CiStat, PipelineContent, UiLabels } from "../types.js";

/** A single stat cell (number + mono label). */
export function renderStat(stat: CiStat): HTMLElement {
  const numberClass = stat.emphasis ? "stat__num stat__num--accent" : "stat__num";
  return el("div", {
    class: "stat",
    children: [
      el("div", { class: numberClass, text: stat.value }),
      el("div", { class: "stat__label", text: stat.label }),
    ],
  });
}

/** CI/CD pipeline panel shown in the hero's right column. */
export function renderPipeline(pipeline: PipelineContent, ui: UiLabels): HTMLElement {
  const status = el("span", {
    class: "pipeline__status",
    children: [el("span", { class: "status-dot", attrs: { "aria-hidden": "true" } }), ui.pipeline.status],
  });

  // Each arrow is grouped with the stage it leads into, so when the row wraps
  // the arrow moves down with that stage instead of dangling at a line end.
  const stageChildren = pipeline.stages.map((stage, index) => {
    const pill = el("span", { class: "pass", text: `✓ ${stage}` });
    if (index === 0) {
      return pill;
    }
    const sep = el("span", { class: "pipeline__sep", text: "›", attrs: { "aria-hidden": "true" } });
    return el("span", { class: "pipeline__step", children: [sep, pill] });
  });

  // The status is placed in the panel's top-right corner by CSS, so the
  // panel has no separate heading line; it stays in the DOM after the stages.
  const stages = el("div", { class: "pipeline__stages", children: [...stageChildren, status] });
  const stats = el("div", { class: "pipeline__stats", children: pipeline.stats.map(renderStat) });

  return el("div", {
    class: "pipeline",
    attrs: { "aria-label": "CI/CD pipeline status: passing" },
    children: [stages, stats],
  });
}
