import { describe, expect, it } from "vitest";
import { renderCommitList, renderCommitRow, renderTerminal, updateCommitList } from "../../../src/sections/git-log.js";
import { siteConfig } from "../../../src/config.js";
import type { Commit } from "../../../src/types.js";

// A fixed clock, so the rendered ages are deterministic rather than drifting
// with the wall clock the suite happens to run at.
const now = new Date("2026-08-24T12:00:00Z");
const withUrl: Commit = {
  hash: "a1f9c2",
  message: "ci: fix flake",
  dateIso: "2026-08-24T10:00:00Z",
  url: "https://x/commit/a1f9c2",
};
const withoutUrl: Commit = { hash: "7e40b1", message: "feat: shard suite", dateIso: "2026-08-23T12:00:00Z" };

describe("renderCommitRow", () => {
  it("links to the commit url in a new tab", () => {
    const row = renderCommitRow(withUrl, now);
    expect(row.getAttribute("href")).toBe(withUrl.url);
    expect(row.getAttribute("target")).toBe("_blank");
    expect(row.getAttribute("aria-label")).toBe("a1f9c2 ci: fix flake, 2h ago");
    expect(row.querySelector(".commit__hash")?.textContent).toBe("a1f9c2");
  });

  it("falls back to a hash anchor when no url is set", () => {
    const row = renderCommitRow(withoutUrl, now);
    expect(row.getAttribute("href")).toBe("#");
    expect(row.getAttribute("target")).toBeNull();
  });
});

describe("renderCommitList / updateCommitList", () => {
  it("renders a row per commit under the test hook", () => {
    const list = renderCommitList([withUrl, withoutUrl], now);
    expect(list.getAttribute("data-testid")).toBe("commit-list");
    expect(list.querySelectorAll(".commit")).toHaveLength(2);
  });

  it("replaces the rows in place", () => {
    const list = renderCommitList([withUrl], now);
    updateCommitList(list, [withoutUrl, withUrl, withoutUrl], now);
    expect(list.querySelectorAll(".commit")).toHaveLength(3);
    expect(list.querySelector(".commit__hash")?.textContent).toBe("7e40b1");
  });
});

describe("renderTerminal", () => {
  it("builds the shell prompt title and branch", () => {
    const terminal = renderTerminal(siteConfig.identity, [withUrl], siteConfig.ui, now);
    const { shellUser, shellHost } = siteConfig.identity;
    expect(terminal.querySelector(".terminal__title")?.textContent).toBe(
      `${shellUser}@${shellHost}: ${siteConfig.ui.terminal.command}`,
    );
    expect(terminal.querySelector(".terminal__branch")?.textContent).toBe(siteConfig.ui.terminal.branch);
    expect(terminal.querySelector('[data-testid="commit-list"]')).not.toBeNull();
  });
});
