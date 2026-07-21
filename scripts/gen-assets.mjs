// Generate the site's binary brand assets into static/ (committed, then copied
// verbatim into public/ by build-site.mjs). Run manually after changing the
// favicon or the OG card design:  `npm run gen:assets`.
//
// It is NOT part of the deploy build (`build:site`): rasterising needs headless
// Chromium (Playwright, a devDependency), which isn't available in the Vercel
// build. Baking the PNG/ICO/OG once and committing them keeps the deploy build
// lightweight and dependency-free.
//
// Produces, all from the single source static/favicon.svg + the self-hosted
// fonts:
//   apple-touch-icon.png (180)  icon-192.png  icon-512.png  favicon-32.png
//   favicon.ico (32, PNG-in-ICO)   og.png (1200×630 social card)

import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const staticDir = join(root, "static");

/** Wrap a PNG in a single-image ICO container (Vista+ accepts PNG payloads). */
function pngToIco(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // image count
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0); // width  (0 ⇒ 256)
  entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
  entry.writeUInt16LE(1, 4); // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8); // image size
  entry.writeUInt32LE(header.length + entry.length, 12); // offset
  return Buffer.concat([header, entry, png]);
}

/** Data URI for a local font file, so the OG card renders in-brand offline. */
async function fontUri(file) {
  const bytes = await readFile(join(staticDir, "fonts", file));
  return `data:font/woff2;base64,${bytes.toString("base64")}`;
}

/** The 1200×630 Open Graph / Twitter share card. Mirrors siteConfig.hero copy. */
async function ogCardHtml() {
  const sg = await fontUri("space-grotesk.woff2");
  const jm = await fontUri("jetbrains-mono.woff2");
  return `<!doctype html><meta charset="utf-8"><style>
    @font-face{font-family:"Space Grotesk";font-weight:400 700;src:url(${sg}) format("woff2")}
    @font-face{font-family:"JetBrains Mono";font-weight:400 500;src:url(${jm}) format("woff2")}
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:1200px;height:630px}
    body{background:
        radial-gradient(120% 140% at 88% -10%, rgba(92,191,136,.16), transparent 55%),
        #181a1b;
      color:#f3f2ec;font-family:"JetBrains Mono",monospace;
      padding:70px 76px;display:flex;flex-direction:column;justify-content:space-between}
    .top{display:flex;align-items:center;gap:14px;color:#a8ada9;font-size:24px}
    .dot{width:15px;height:15px;border-radius:50%}
    .r{background:#ff5f57}.a{background:#febc2e}.g{background:#28c840}
    .prompt{margin-left:10px}
    .kicker{color:#5cbf88;font-size:27px;letter-spacing:.02em;margin-bottom:18px}
    h1{font-family:"Space Grotesk",sans-serif;font-weight:700;font-size:104px;
      line-height:.98;letter-spacing:-.02em}
    h1 .accent{color:#5cbf88}
    .bottom{display:flex;align-items:center;justify-content:space-between;font-size:26px}
    .stages{display:flex;align-items:center;gap:20px;color:#c9cdc8}
    .pill{color:#5cbf88;border:1.5px solid rgba(92,191,136,.4);
      border-radius:999px;padding:9px 20px;font-size:23px}
    .sep{color:#5cbf88}
    .domain{font-family:"Space Grotesk",sans-serif;font-weight:500;color:#f3f2ec}
  </style>
  <div class="top">
    <span class="dot r"></span><span class="dot a"></span><span class="dot g"></span>
    <span class="prompt">charlie@testing:~$ ./whoami</span>
  </div>
  <div>
    <div class="kicker">// senior test engineer · automation &amp; devops</div>
    <h1>I break things<br>so users don't<span class="accent">.</span></h1>
  </div>
  <div class="bottom">
    <div class="stages">
      <span class="pill">build: passing</span>
      <span>build <span class="sep">·</span> lint <span class="sep">·</span> test <span class="sep">·</span> deploy</span>
    </div>
    <span class="domain">testingcharlie.co.uk</span>
  </div>`;
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const svg = await readFile(join(staticDir, "favicon.svg"), "utf8");

  // Square icon PNGs. The page background matches the tile, so the rounded
  // corners fill in solid — iOS/Android add their own masking.
  for (const { size, name } of [
    { size: 180, name: "apple-touch-icon.png" },
    { size: 192, name: "icon-192.png" },
    { size: 512, name: "icon-512.png" },
    { size: 32, name: "favicon-32.png" },
  ]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(
      `<!doctype html><meta charset="utf-8"><style>
        html,body{margin:0;width:${size}px;height:${size}px;background:#181a1b}
        svg{width:${size}px;height:${size}px;display:block}</style>${svg}`,
    );
    const png = await page.screenshot({ clip: { x: 0, y: 0, width: size, height: size } });
    await writeFile(join(staticDir, name), png);
    console.log(`static/${name}  (${size}×${size})`);
  }

  const ico = pngToIco(await readFile(join(staticDir, "favicon-32.png")), 32);
  await writeFile(join(staticDir, "favicon.ico"), ico);
  console.log(`static/favicon.ico  (32×32, ${ico.length} bytes)`);

  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(await ogCardHtml(), { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const og = await page.screenshot({ clip: { x: 0, y: 0, width: 1200, height: 630 } });
  await writeFile(join(staticDir, "og.png"), og);
  console.log(`static/og.png  (1200×630, ${og.length} bytes)`);

  await browser.close();
}

await main();
