import { describe, expect, it } from "vitest";
import { renderCommitList, renderCommitRow, renderTerminal, updateCommitList } from "../../../src/sections/git-log.js";
import { siteConfig } from "../../../src/config.js";
import type { Commit } from "../../../src/types.js";

const withUrl: Commit = { hash: "a1f9c2", message: "ci: fix flake", relativeTime: "2h ago", url: "https://x/commit/a1f9c2" };
const withoutUrl: Commit = { hash: "7e40b1", message: "feat: shard suite", relativeTime: "yesterday" };

describe("renderCommitRow", () => {
  it("links to the commit url in a new tab", () => {
    const row = renderCommitRow(withUrl);
    expect(row.getAttribute("href")).toBe(withUrl.url);
    expect(row.getAttribute("target")).toBe("_blank");
    expect(row.getAttribute("aria-label")).toBe("a1f9c2 ci: fix flake, 2h ago");
    expect(row.querySelector(".commit__hash")?.textContent).toBe("a1f9c2");
  });

  it("falls back to a hash anchor when no url is set", () => {
    const row = renderCommitRow(withoutUrl);
    expect(row.getAttribute("href")).toBe("#");
    expect(row.getAttribute("target")).toBeNull();
  });
});

describe("renderCommitList / updateCommitList", () => {
  it("renders a row per commit under the test hook", () => {
    const list = renderCommitList([withUrl, withoutUrl]);
    expect(list.getAttribute("data-testid")).toBe("commit-list");
    expect(list.querySelectorAll(".commit")).toHaveLength(2);
  });

  it("replaces the rows in place", () => {
    const list = renderCommitList([withUrl]);
    updateCommitList(list, [withoutUrl, withUrl, withoutUrl]);
    expect(list.querySelectorAll(".commit")).toHaveLength(3);
    expect(list.querySelector(".commit__hash")?.textContent).toBe("7e40b1");
  });
});

describe("renderTerminal", () => {
  it("builds the shell prompt title and branch", () => {
    const terminal = renderTerminal(siteConfig.identity, [withUrl]);
    expect(terminal.querySelector(".terminal__title")?.textContent).toBe("charlie@testing: git log --oneline");
    expect(terminal.querySelector(".terminal__branch")?.textContent).toBe("main ✓");
    expect(terminal.querySelector('[data-testid="commit-list"]')).not.toBeNull();
  });
});
