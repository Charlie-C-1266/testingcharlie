// Write src/github-activity.generated.ts from live GitHub data.
//
// Runs BEFORE tsc (src/seed.ts imports the generated module). Resilient by
// design: any network/token failure leaves the last committed file untouched
// and exits 0, so a build is never blocked by a rate limit or an outage.
//
// Public data (commits, repos) needs no token. The contribution calendar is
// fetched only when GH_CONTRIB_TOKEN is set. Set it in the Vercel project's
// Environment Variables (and locally: `GH_CONTRIB_TOKEN=xxx npm run build:site`)
// using a read-only GitHub PAT. It is a build secret and never ships.

import { existsSync, readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fetchContributions, fetchPublicActivity, renderManifest } from "./github.mjs";

/** Minimal .env loader (no dependency): fills process.env for KEY=VALUE lines. */
function loadDotEnv() {
  const path = join(process.cwd(), ".env");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!(key in process.env)) {
      process.env[key] = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    }
  }
}

loadDotEnv();
const LOGIN = "Charlie-C-1266";
const target = join(process.cwd(), "src", "github-activity.generated.ts");
const token = process.env.GH_CONTRIB_TOKEN;

/** True when the committed file already holds a real (token-populated) calendar. */
function committedHasCalendar() {
  if (!existsSync(target)) return false;
  return /contributionCells: ContributionCell\[\] = \[\s*\n/.test(readFileSync(target, "utf8"));
}

async function main() {
  // No token this build, but a real calendar is already committed: leave the
  // file untouched rather than overwrite it with an empty calendar just to
  // refresh commits. (On Vercel the token is set, so deploys always refresh.)
  if (!token && committedHasCalendar()) {
    console.warn("ℹ GH_CONTRIB_TOKEN not set and a real calendar is already committed; leaving the file untouched.");
    return;
  }

  let publicActivity;
  try {
    publicActivity = await fetchPublicActivity(LOGIN, { token });
  } catch (error) {
    console.warn(`⚠ Skipping GitHub activity bake (public fetch failed: ${error.message}). Keeping committed file.`);
    return;
  }

  let contributionTotal = 0;
  let contributionCells = [];
  if (token) {
    try {
      const contributions = await fetchContributions(LOGIN, token);
      contributionTotal = contributions.total;
      contributionCells = contributions.cells;
    } catch (error) {
      console.warn(`⚠ Contribution calendar fetch failed (${error.message}); baking public data only.`);
    }
  } else {
    console.warn("ℹ GH_CONTRIB_TOKEN not set; baking public data only (contribution grid stays empty).");
  }

  const manifest = renderManifest({
    commits: publicActivity.commits,
    publicRepoCount: publicActivity.publicRepoCount,
    profileUrl: publicActivity.profileUrl,
    contributionTotal,
    contributionCells,
    generatedAt: new Date().toISOString(),
  });

  await writeFile(target, manifest);
  console.log(
    `Baked GitHub activity → src/github-activity.generated.ts ` +
      `(${publicActivity.commits.length} commits, ${publicActivity.publicRepoCount} repos, ` +
      `${contributionCells.length} calendar cells)`,
  );
}

await main();
