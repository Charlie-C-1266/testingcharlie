// A tiny typed helper for building DOM elements. It keeps the render modules
// declarative (no repetitive createElement/append boilerplate) while staying
// fully type-checked: `el("a", …)` returns an HTMLAnchorElement, etc.

/** A child of an element: a real node or a string (turned into a text node). */
export type ElChild = Node | string;

/** Options accepted by {@link el}. */
export interface ElOptions {
  /** `class` attribute (single string; space-separated for multiple). */
  class?: string;
  /** Text content. Mutually exclusive with `children`; set via textContent. */
  text?: string;
  /** Plain attributes (href, type, aria-*, role, data-testid, …). */
  attrs?: Record<string, string>;
  /** `data-*` entries; keys are camelCase and map onto element.dataset. */
  dataset?: Record<string, string>;
  /** Child nodes / strings appended in order. */
  children?: ElChild[];
}

/**
 * Create an element of `tag`, apply `options`, and return it strongly typed.
 *
 * @example el("a", { class: "chip", text: "GitHub ↗", attrs: { href: url } })
 */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: ElOptions = {},
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);

  if (options.class !== undefined) {
    node.className = options.class;
  }
  if (options.text !== undefined) {
    node.textContent = options.text;
  }
  if (options.attrs) {
    for (const [name, value] of Object.entries(options.attrs)) {
      node.setAttribute(name, value);
    }
  }
  if (options.dataset) {
    for (const [name, value] of Object.entries(options.dataset)) {
      node.dataset[name] = value;
    }
  }
  if (options.children) {
    node.append(...options.children);
  }

  return node;
}

/** Remove every child of `node`. Used before re-rendering a hydrated panel. */
export function clear(node: Node): void {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

/** Replace all children of `node` with `children`, in order. */
export function replaceChildren(node: Element, children: ElChild[]): void {
  node.replaceChildren(...children);
}

/**
 * Build an external-link anchor with the correct security rel. Any link that
 * opens a new tab must carry rel="noopener noreferrer" (tab-napping guard).
 */
export function externalLink(
  href: string,
  className: string,
  children: ElChild[],
  extraAttrs: Record<string, string> = {},
): HTMLAnchorElement {
  return el("a", {
    class: className,
    attrs: {
      href,
      target: "_blank",
      rel: "noopener noreferrer",
      ...extraAttrs,
    },
    children,
  });
}

/** Whether `href` points off-site (http/https) and should open in a new tab. */
export function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

/**
 * Anchor factory that opens off-site links in a new tab (with the safe rel)
 * and keeps same-page / mailto / relative links in place.
 */
export function linkTo(
  href: string,
  className: string,
  children: ElChild[],
  extraAttrs: Record<string, string> = {},
): HTMLAnchorElement {
  if (isExternal(href)) {
    return externalLink(href, className, children, extraAttrs);
  }
  return el("a", {
    class: className,
    attrs: { href, ...extraAttrs },
    children,
  });
}

/** Turn `["a", "b"]` into `["a", <br>, "b"]` for multi-line headings. */
export function multiline(lines: string[]): ElChild[] {
  const children: ElChild[] = [];
  lines.forEach((line, index) => {
    if (index > 0) {
      children.push(el("br"));
    }
    children.push(line);
  });
  return children;
}
