import { defineConfig } from "vitest/config";

// The source uses nodenext module resolution, so imports carry explicit `.js`
// extensions even though the files on disk are `.ts`. Vite/esbuild resolves
// bare specifiers, so we alias `.js` back to `.ts` (falling through to a real
// `.js` if one ever exists) — the standard bridge for TS + bundler tooling.
export default defineConfig({
  resolve: {
    extensionAlias: {
      ".js": [".ts", ".js"],
    },
  },
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.ts"],
    // e2e specs live under tests/e2e and are driven by Playwright, not Vitest.
    exclude: ["tests/e2e/**", "node_modules/**"],
    globals: false,
    restoreMocks: true,
    clearMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html"],
      reportsDirectory: "coverage",
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.d.ts",
        // Thin composition-root wiring is exercised end-to-end by Playwright.
        "src/main.ts",
        // Build-time generated data (from content/blog/*.md); no logic to cover.
        "src/posts.generated.ts",
      ],
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 95,
        statements: 95,
      },
    },
  },
});
