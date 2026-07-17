import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The deployed Content-Security-Policy (vercel.json) allows the single inline
// boot script in index.html by its sha256 hash, not 'unsafe-inline'. If either
// the script or the pinned hash changes without the other, the browser would
// silently refuse to run the boot script in production. These tests fail fast
// on that drift and assert the page keeps no other inline scripts/styles that
// the strict policy would block.

// Vitest runs with the repo root as its working directory.
function read(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const html = read("index.html");
const vercelConfig = read("vercel.json");

/** Content of the one attribute-less <script> tag (the anti-FOUC boot code). */
function inlineBootScript(): string {
  const match = html.match(/<script>([\s\S]*?)<\/script>/);
  if (match?.[1] === undefined) {
    throw new Error("Expected an inline <script> boot block in index.html");
  }
  return match[1];
}

/** The sha256 source pinned in the CSP script-src directive of vercel.json. */
function pinnedScriptHash(): string {
  const match = vercelConfig.match(/'(sha256-[A-Za-z0-9+/]+=*)'/);
  if (match?.[1] === undefined) {
    throw new Error("Expected a sha256 script hash in vercel.json CSP");
  }
  return match[1];
}

describe("Content-Security-Policy", () => {
  it("pins the exact hash of the inline boot script", () => {
    const digest = createHash("sha256").update(inlineBootScript(), "utf8").digest("base64");
    expect(pinnedScriptHash()).toBe(`sha256-${digest}`);
  });

  it("does not rely on 'unsafe-inline' for scripts or styles", () => {
    expect(vercelConfig).not.toContain("'unsafe-inline'");
    expect(vercelConfig).not.toContain("'unsafe-eval'");
  });

  it("keeps index.html free of inline style attributes and event handlers", () => {
    expect(html).not.toMatch(/\sstyle=/);
    expect(html).not.toMatch(/\son[a-z]+=/i);
  });

  it("allows the only external origins the page actually uses", () => {
    expect(vercelConfig).toContain("https://fonts.googleapis.com");
    expect(vercelConfig).toContain("https://fonts.gstatic.com");
    expect(vercelConfig).toContain("https://api.github.com");
  });
});
