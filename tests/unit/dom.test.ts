import { describe, expect, it } from "vitest";
import { clear, el, externalLink, isExternal, linkTo, multiline, replaceChildren } from "../../src/dom.js";

describe("el", () => {
  it("returns a strongly typed element with defaults", () => {
    const div = el("div");
    expect(div.tagName).toBe("DIV");
    expect(div.className).toBe("");
    expect(div.childNodes.length).toBe(0);
  });

  it("applies class, text, attrs and dataset", () => {
    const a = el("a", {
      class: "chip",
      text: "hello",
      attrs: { href: "/x", "aria-label": "Hello" },
      dataset: { testid: "greeting" },
    });
    expect(a.className).toBe("chip");
    expect(a.textContent).toBe("hello");
    expect(a.getAttribute("href")).toBe("/x");
    expect(a.getAttribute("aria-label")).toBe("Hello");
    expect(a.dataset.testid).toBe("greeting");
  });

  it("appends string and node children in order", () => {
    const span = el("span", { text: "inner" });
    const p = el("p", { children: ["a", span, "b"] });
    expect(p.childNodes.length).toBe(3);
    expect(p.textContent).toBe("ainnerb");
    expect(p.childNodes[1]).toBe(span);
  });
});

describe("clear / replaceChildren", () => {
  it("clear removes every child", () => {
    const list = el("ul", { children: [el("li"), el("li"), el("li")] });
    clear(list);
    expect(list.childNodes.length).toBe(0);
  });

  it("replaceChildren swaps in a new set", () => {
    const list = el("ul", { children: [el("li", { text: "old" })] });
    replaceChildren(list, [el("li", { text: "new" }), "tail"]);
    expect(list.textContent).toBe("newtail");
  });
});

describe("isExternal", () => {
  it("recognises http(s) URLs only", () => {
    expect(isExternal("https://example.com")).toBe(true);
    expect(isExternal("http://example.com")).toBe(true);
    expect(isExternal("mailto:a@b.com")).toBe(false);
    expect(isExternal("#anchor")).toBe(false);
    expect(isExternal("/relative")).toBe(false);
  });
});

describe("externalLink", () => {
  it("opens in a new tab with a safe rel", () => {
    const a = externalLink("https://example.com", "link", ["go"], { "data-testid": "x" });
    expect(a.getAttribute("target")).toBe("_blank");
    expect(a.getAttribute("rel")).toBe("noopener noreferrer");
    expect(a.getAttribute("href")).toBe("https://example.com");
    expect(a.getAttribute("data-testid")).toBe("x");
    expect(a.textContent).toBe("go");
  });
});

describe("linkTo", () => {
  it("uses an external link for off-site URLs", () => {
    const a = linkTo("https://example.com", "c", ["ext"]);
    expect(a.getAttribute("target")).toBe("_blank");
    expect(a.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("keeps same-page and mailto links in place", () => {
    const a = linkTo("mailto:a@b.com", "c", ["mail"], { title: "t" });
    expect(a.getAttribute("target")).toBeNull();
    expect(a.getAttribute("href")).toBe("mailto:a@b.com");
    expect(a.getAttribute("title")).toBe("t");
  });
});

describe("multiline", () => {
  it("interleaves <br> between lines", () => {
    const children = multiline(["one", "two", "three"]);
    expect(children.length).toBe(5);
    expect(children[0]).toBe("one");
    expect((children[1] as HTMLElement).tagName).toBe("BR");
    expect(children[2]).toBe("two");
  });

  it("returns a single string for one line", () => {
    expect(multiline(["solo"])).toEqual(["solo"]);
  });
});
