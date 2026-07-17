import { el, linkTo } from "../dom.js";
import type { ElChild } from "../dom.js";
import type { WorkProject } from "../types.js";

/** A project link-card (title + optional passing pill + description + meta). */
export function renderWorkCard(project: WorkProject): HTMLAnchorElement {
  const headChildren: ElChild[] = [el("h3", { class: "project-card__title", text: project.name })];
  if (project.passing) {
    headChildren.push(el("span", { class: "pass pass--sm", text: "✓ passing" }));
  }

  const children: ElChild[] = [
    el("div", { class: "project-card__head", children: headChildren }),
    el("p", { class: "project-card__desc", text: project.description }),
    el("div", { class: "project-card__meta", text: project.meta }),
  ];

  const attrs = { "aria-label": `${project.name} — ${project.meta}` };
  return linkTo(project.url, "project-card", children, attrs);
}

/** More-work section (6): a two-up grid of project cards. */
export function renderWork(projects: WorkProject[]): HTMLElement {
  return el("section", {
    class: "work",
    attrs: { id: "work", "aria-label": "More work" },
    children: [
      el("div", { class: "prompt", text: "$ ~/more-work" }),
      el("div", { class: "work__grid", children: projects.map(renderWorkCard) }),
    ],
  });
}
