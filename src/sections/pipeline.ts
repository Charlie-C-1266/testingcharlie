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

  const stageChildren = pipeline.stages.flatMap((stage, index) => {
    const pill = el("span", { class: "pass", text: `✓ ${stage}` });
    if (index === pipeline.stages.length - 1) {
      return [pill];
    }
    return [pill, el("span", { class: "pipeline__sep", text: "›", attrs: { "aria-hidden": "true" } })];
  });

  // The status rides at the end of the stages row (pushed right by CSS), so the
  // panel has no separate heading line and it follows "deploy" when stages wrap.
  const stages = el("div", { class: "pipeline__stages", children: [...stageChildren, status] });
  const stats = el("div", { class: "pipeline__stats", children: pipeline.stats.map(renderStat) });

  return el("div", {
    class: "pipeline",
    attrs: { "aria-label": "CI/CD pipeline status: passing" },
    children: [stages, stats],
  });
}
