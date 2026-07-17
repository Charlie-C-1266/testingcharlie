import { el, linkTo } from "../dom.js";
import type { ElChild } from "../dom.js";
import type { Post } from "../types.js";

/** A writing row: title + blurb on the left, date + read time on the right. */
export function renderPostRow(post: Post): HTMLAnchorElement {
  const left = el("span", {
    children: [
      el("span", { class: "post__title", text: post.title }),
      el("span", { class: "post__blurb", text: post.blurb }),
    ],
  });

  const meta = el("span", {
    class: "post__meta",
    children: [post.date, el("br"), post.readingTime],
  });

  return linkTo(post.url, "post", [left, meta], {
    "aria-label": `${post.title} — ${post.date}, ${post.readingTime}`,
  });
}

/** Placeholder shown when there are no posts yet. */
export function renderComingSoon(): HTMLElement {
  return el("div", {
    class: "writing__soon",
    children: ["coming soon", el("span", { class: "writing__cursor", text: "_", attrs: { "aria-hidden": "true" } })],
  });
}

/** Writing section (7): a list of post rows, or "coming soon" when empty. */
export function renderWriting(posts: Post[]): HTMLElement {
  const body: ElChild[] = posts.length > 0 ? posts.map(renderPostRow) : [renderComingSoon()];
  return el("section", {
    class: "writing",
    attrs: { id: "writing", "aria-label": "Writing" },
    children: [el("div", { class: "prompt", text: "$ ~/writing" }), ...body],
  });
}
