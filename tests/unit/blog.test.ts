import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
// The blog engine is a build-time module (plain ESM, run by Node in the build
// pipeline, never shipped to the browser). We unit-test its pure functions here.
import {
  THEME_BOOT_SCRIPT,
  computeReadingTime,
  deriveSlug,
  escapeHtml,
  formatDate,
  parseFrontmatter,
  renderBlogIndex,
  renderPostPage,
  renderPostsManifest,
} from "../../scripts/blog.mjs";

const read = (rel: string): string => readFileSync(join(process.cwd(), rel), "utf8");

/** A minimal rendered-post record, as loadPosts() would produce. */
function samplePost(overrides: Record<string, unknown> = {}) {
  return {
    slug: "flaky-tests",
    url: "/blog/flaky-tests",
    title: "Taming <flaky> specs",
    blurb: "A triage playbook.",
    description: "Longer summary.",
    date: "2026-07-18",
    dateDisplay: "18 Jul 2026",
    readingTime: "6 min",
    tags: ["playwright"],
    bodyHtml: "<p>Body goes here.</p>",
    ...overrides,
  };
}

describe("parseFrontmatter", () => {
  it("parses quoted, plain, and list values and splits off the body", () => {
    const { data, body } = parseFrontmatter(
      `---\ntitle: "Hello: world"\nblurb: A plain value\ntags: [a, b, c]\n---\n\nBody line one.`,
    );
    expect(data.title).toBe("Hello: world");
    expect(data.blurb).toBe("A plain value");
    expect(data.tags).toEqual(["a", "b", "c"]);
    expect(body).toBe("Body line one.");
  });

  it("returns empty data and the trimmed body when there is no frontmatter", () => {
    const { data, body } = parseFrontmatter("\n# Just markdown\n");
    expect(data).toEqual({});
    expect(body).toBe("# Just markdown");
  });
});

describe("computeReadingTime", () => {
  it("rounds up at ~200 wpm and never returns less than a minute", () => {
    expect(computeReadingTime("word ".repeat(400))).toBe("2 min");
    expect(computeReadingTime("just a few words")).toBe("1 min");
  });

  it("ignores fenced code blocks when counting", () => {
    const withCode = "one two three\n```\n" + "x ".repeat(1000) + "\n```";
    expect(computeReadingTime(withCode)).toBe("1 min");
  });
});

describe("deriveSlug", () => {
  it("drops the .md extension and any leading yyyy-mm-dd- prefix", () => {
    expect(deriveSlug("2026-07-17-hello-world.md")).toBe("hello-world");
    expect(deriveSlug("no-date-here.md")).toBe("no-date-here");
  });
});

describe("formatDate", () => {
  it("formats ISO dates and passes non-ISO input through unchanged", () => {
    expect(formatDate("2026-07-17")).toBe("17 Jul 2026");
    expect(formatDate("")).toBe("");
    expect(formatDate("someday")).toBe("someday");
  });
});

describe("escapeHtml", () => {
  it("escapes the five HTML-significant characters", () => {
    expect(escapeHtml(`<a href="x" &'`)).toBe("&lt;a href=&quot;x&quot; &amp;&#39;");
  });
});

describe("renderPostPage", () => {
  const html = renderPostPage(samplePost());

  it("escapes the title in the document", () => {
    expect(html).toContain("Taming &lt;flaky&gt; specs");
    expect(html).toContain("<p>Body goes here.</p>");
  });

  it("links the blog stylesheet with an absolute path so /blog/* resolve it", () => {
    expect(html).toContain('href="/styles/blog.css"');
    expect(html).toContain('href="/styles/tokens.css"');
  });

  it("carries exactly one inline script and no CSP-blocked inline hooks", () => {
    expect(html.match(/<script/g)).toHaveLength(1);
    expect(html).toContain(`<script>${THEME_BOOT_SCRIPT}</script>`);
    expect(html).not.toMatch(/\sstyle=/);
    expect(html).not.toMatch(/\son[a-z]+=/i);
  });
});

describe("renderBlogIndex", () => {
  it("lists each post, and shows an empty state when there are none", () => {
    const listed = renderBlogIndex([samplePost()]);
    expect(listed).toContain('href="/blog/flaky-tests"');
    expect(listed).toContain("18 Jul 2026");
    expect(renderBlogIndex([])).toContain("No posts yet");
  });
});

describe("renderPostsManifest", () => {
  it("emits a typed module using the display date and post URL", () => {
    const manifest = renderPostsManifest([samplePost({ title: "Post \"one\"" })]);
    expect(manifest).toContain('import type { Post } from "./types.js";');
    expect(manifest).toContain('url: "/blog/flaky-tests"');
    expect(manifest).toContain('date: "18 Jul 2026"'); // the display date, not ISO
    expect(manifest).toContain('title: "Post \\"one\\""'); // JSON-escaped
  });

  it("emits an empty array literal when there are no posts", () => {
    expect(renderPostsManifest([])).toContain("export const generatedPosts: Post[] = [];");
  });
});

describe("CSP: blog pages reuse the homepage's pinned boot script", () => {
  it("uses the exact inline boot script from index.html (no drift)", () => {
    const indexInline = read("index.html").match(/<script>([\s\S]*?)<\/script>/)?.[1];
    expect(THEME_BOOT_SCRIPT).toBe(indexInline);
  });

  it("hashes to the sha256 pinned in vercel.json's script-src", () => {
    const pinned = read("vercel.json").match(/'(sha256-[A-Za-z0-9+/]+=*)'/)?.[1];
    const digest = createHash("sha256").update(THEME_BOOT_SCRIPT, "utf8").digest("base64");
    expect(pinned).toBe(`sha256-${digest}`);
  });
});
