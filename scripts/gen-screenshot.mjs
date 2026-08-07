// Bake the featured-project screenshot into static/ (committed, then copied
// verbatim into public/ by build-site.mjs). Run manually after the featured
// site's design changes:  `npm run gen:screenshot`.
//
// Like gen-assets.mjs this is NOT part of the deploy build (`build:site`):
// rasterising needs headless Chromium (Playwright, a devDependency) and, here,
// network access to the live site — neither is available in the Vercel build.
// Baking the PNG once and committing it keeps the deploy build lightweight,
// hermetic and dependency-free.
//
// Single source: the page to capture (`featured.url`) and the output path
// (`featured.screenshot.src`, e.g. /caniaffordthat.png → static/caniaffordthat.png)
// both come from dist/config.js, so this never drifts from the rendered page.
// Requires `tsc` to have run first (the npm script chains it).

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { siteConfig } from "../dist/config.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const staticDir = join(root, "static");

// 16:10 matches the .browser__body aspect-ratio; the image is shown with
// object-fit: cover. deviceScaleFactor 2 keeps it crisp on retina displays.
const WIDTH = 1280;
const HEIGHT = 800;

async function main() {
  const { url, screenshot } = siteConfig.featured;
  if (!screenshot.src) {
    throw new Error(
      "featured.screenshot.src is unset — nothing to bake. Set it in src/config.ts first.",
    );
  }
  // "/caniaffordthat.png" → static/caniaffordthat.png (served at the same path).
  const dest = join(staticDir, screenshot.src.replace(/^\//, ""));

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 2,
  });
  await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
  await page.evaluate(() => document.fonts.ready);

  // Clip to the viewport (not full page) so the capture is exactly 16:10.
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
  await writeFile(dest, png);
  console.log(`static/${screenshot.src.replace(/^\//, "")}  (${WIDTH}×${HEIGHT}@2x, ${png.length} bytes ← ${url})`);

  await browser.close();
}

await main();
