import { execFileSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// Build-time module (plain ESM, run by Node in the build pipeline). These specs
// cover the draft mechanism: the thing that separates "written" from
// "published", given that presence in content/blog/ is otherwise publication.
import { loadPosts, parseBooleanField } from "../../scripts/blog.mjs";

const root = process.cwd();

describe("parseBooleanField", () => {
  it("reads only a case-insensitive 'true' as true", () => {
    expect(parseBooleanField("true")).toBe(true);
    expect(parseBooleanField("TRUE")).toBe(true);
    expect(parseBooleanField("  true  ")).toBe(true);
  });

  it("treats anything else — including a missing key — as false", () => {
    expect(parseBooleanField("false")).toBe(false);
    expect(parseBooleanField("yes")).toBe(false);
    expect(parseBooleanField("")).toBe(false);
    expect(parseBooleanField(undefined)).toBe(false);
    // Frontmatter list values arrive as arrays; they are never a boolean.
    expect(parseBooleanField(["true"])).toBe(false);
  });
});

describe("loadPosts draft handling", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "blog-drafts-"));
    const frontmatter = (title: string, date: string, draft: boolean): string =>
      ["---", `title: "${title}"`, `date: ${date}`, 'blurb: "b"']
        .concat(draft ? ["draft: true"] : [])
        .concat(["---", "", "Body copy."])
        .join("\n");

    // Distinct dates: posts come back newest first, so the draft sorts ahead.
    await writeFile(join(dir, "2026-07-18-published.md"), frontmatter("Published", "2026-07-18", false));
    await writeFile(join(dir, "2026-07-19-unfinished.md"), frontmatter("Unfinished", "2026-07-19", true));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
    vi.unstubAllEnvs();
  });

  it("excludes draft posts by default", async () => {
    const posts = await loadPosts(dir);
    expect(posts.map((p) => p.title)).toEqual(["Published"]);
  });

  it("includes drafts when explicitly asked", async () => {
    const posts = await loadPosts(dir, { includeDrafts: true });
    expect(posts.map((p) => p.title)).toEqual(["Unfinished", "Published"]);
  });

  it("includes drafts when BLOG_INCLUDE_DRAFTS=1, for local preview", async () => {
    vi.stubEnv("BLOG_INCLUDE_DRAFTS", "1");
    const posts = await loadPosts(dir);
    expect(posts.map((p) => p.title)).toContain("Unfinished");
  });

  it("keeps excluding drafts for any other value of BLOG_INCLUDE_DRAFTS", async () => {
    vi.stubEnv("BLOG_INCLUDE_DRAFTS", "true");
    const posts = await loadPosts(dir);
    expect(posts.map((p) => p.title)).toEqual(["Published"]);
  });

  it("tags each post with its source file and draft state", async () => {
    const posts = await loadPosts(dir, { includeDrafts: true });
    expect(posts.find((p) => p.title === "Unfinished")).toMatchObject({
      sourceFile: "2026-07-19-unfinished.md",
      draft: true,
    });
    expect(posts.find((p) => p.title === "Published")).toMatchObject({
      sourceFile: "2026-07-18-published.md",
      draft: false,
    });
  });
});

/**
 * The guard. A build regenerates the *tracked* src/posts.generated.ts from
 * whatever sits in content/blog/, so an unfinished or untracked draft on disk
 * can leak into a committed file and publish itself. CI never catches this —
 * a fresh checkout has no untracked files — so the check has to run here.
 */
describe("src/posts.generated.ts contains only publishable posts", () => {
  const manifest = readFileSync(join(root, "src", "posts.generated.ts"), "utf8");

  /** Post source files git actually tracks; null if git is unavailable. */
  function trackedSources(): Set<string> | null {
    try {
      const out = execFileSync("git", ["ls-files", "content/blog"], {
        cwd: root,
        encoding: "utf8",
      });
      return new Set(
        out
          .split("\n")
          .filter(Boolean)
          .map((p) => p.split("/").pop() as string),
      );
    } catch {
      return null; // No git (e.g. a source export) — the draft check still applies.
    }
  }

  it("lists no post marked draft: true", async () => {
    const drafts = (await loadPosts(undefined, { includeDrafts: true })).filter((p) => p.draft);
    for (const post of drafts) {
      expect(
        manifest.includes(`"${post.url}"`),
        `${post.sourceFile} is marked draft but reached the manifest — rebuild with ` +
          "`npm run build:site` and commit the result, or remove the draft flag to publish it.",
      ).toBe(false);
    }
  });

  it("lists no post whose source file git does not track", async () => {
    const tracked = trackedSources();
    if (tracked === null) {
      return;
    }
    const posts = await loadPosts(undefined, { includeDrafts: true });
    for (const post of posts.filter((p) => !tracked.has(p.sourceFile))) {
      expect(
        manifest.includes(`"${post.url}"`),
        `${post.sourceFile} is untracked but reached the manifest — a local build baked an ` +
          "unpublished draft into a tracked file. Run `git checkout -- src/posts.generated.ts`.",
      ).toBe(false);
    }
  });
});
