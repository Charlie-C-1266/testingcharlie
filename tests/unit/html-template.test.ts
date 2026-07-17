import { describe, expect, it } from "vitest";
// Pure build-time HTML templating helpers (plain ESM, run by Node in the build
// pipeline, never shipped to the browser).
import { applyTemplate, escapeHtml } from "../../scripts/html-template.mjs";

describe("escapeHtml", () => {
  it("escapes the characters unsafe in text and double-quoted attributes", () => {
    expect(escapeHtml(`a & b < c > "d"`)).toBe("a &amp; b &lt; c &gt; &quot;d&quot;");
  });

  it("leaves ordinary copy (incl. em dash / middot) untouched", () => {
    expect(escapeHtml("Charlie · Senior Engineer — Bristol")).toBe("Charlie · Senior Engineer — Bristol");
  });
});

describe("applyTemplate", () => {
  it("replaces every known __TOKEN__ with its value", () => {
    const html = `<title>__T__</title><meta content="__D__" />`;
    expect(applyTemplate(html, { T: "Hi", D: "there" })).toBe(`<title>Hi</title><meta content="there" />`);
  });

  it("throws (fail loud) when a placeholder is left unresolved", () => {
    expect(() => applyTemplate("<title>__MISSING__</title>", { OTHER: "x" })).toThrow(/__MISSING__/);
  });

  it("replaces every occurrence of a repeated token", () => {
    expect(applyTemplate("__X__/__X__", { X: "y" })).toBe("y/y");
  });
});
