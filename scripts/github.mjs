// Build-time GitHub activity fetch. Bakes REAL recent activity into
// src/github-activity.generated.ts so the recent-activity section never ships
// fabricated data.
//
// Two tiers of data:
//   - Public (recent commits, public repo count, profile URL) come from the
//     UNAUTHENTICATED REST API — no token needed. NB: the public *events*
//     endpoint no longer returns commit details in its PushEvent payloads, so
//     we read commits from the recently-pushed repos' /commits endpoints.
//   - The contribution CALENDAR + yearly total need an authenticated GraphQL
//     call, so they are fetched only when GH_CONTRIB_TOKEN is set (a read-only
//     GitHub PAT, kept as a build secret, never shipped to the browser).
//
// Without the token the calendar stays empty and the panel shows real repos
// only — never a fake grid. This module holds pure, unit-tested helpers plus the
// network fetchers; scripts/build-github-activity.mjs is the thin I/O shell.

const SHORT_HASH_LENGTH = 6;

/** First line of a commit message (git-log --oneline style). */
function firstLine(message) {
  const newline = message.indexOf("\n");
  return newline === -1 ? message : message.slice(0, newline);
}

/**
 * Pick the `owner/repo` names to read commits from: the user's own,
 * non-fork, non-archived repos, already ordered newest-pushed-first by the API,
 * capped at `max`. Using the repos endpoint (not the events feed) means a repo
 * shows up as soon as it's public + recently pushed — no dependency on a public
 * PushEvent existing, which past private pushes never generate.
 */
export function selectRepos(repos, max) {
  return (
    repos
      // Public only — never surface private-repo commits, even when the build is
      // authenticated (an authed /repos call also returns private repos).
      .filter((repo) => !repo.fork && !repo.archived && !repo.private)
      .slice(0, max)
      .map((repo) => repo.full_name)
  );
}

/** A GitHub App / bot account login, e.g. `dependabot[bot]`, `github-actions[bot]`. */
const BOT_LOGIN = /\[bot\]$/i;
/** A bot's commit email, e.g. `github-stats[bot]@jstrieb.github.io`. */
const BOT_EMAIL = /\[bot\]@/i;

/**
 * True when a `/commits` REST item was authored by automation rather than a
 * person. Judged on the commit's *author* identity, never its message:
 *   - a linked bot account → `author.type === "Bot"` / a `[bot]` login suffix
 *     (Dependabot, github-actions, Renovate…);
 *   - a bot with no linked account (`author: null`, e.g. a scheduled action
 *     committing as `github-stats[bot]@…`) → a `[bot]` in the commit email.
 * The committer is deliberately ignored: a human's PR squash-merged through the
 * web UI is committed by `web-flow`, and that work belongs in the feed.
 */
export function isAutomatedCommit(item) {
  if (item.author?.type === "Bot") return true;
  if (BOT_LOGIN.test(item.author?.login ?? "")) return true;
  return BOT_EMAIL.test(item.commit.author?.email ?? "");
}

/**
 * Map a repo's `/commits` REST response to lightweight commit records, dropping
 * merge commits (2+ parents) for a clean `git log --no-merges` style feed, and
 * automated commits so dependency bumps and generated-file churn never crowd
 * out real work.
 */
export function mapRestCommits(restCommits) {
  const mapped = [];
  for (const item of restCommits) {
    if ((item.parents?.length ?? 0) > 1) continue; // skip merge commits
    if (isAutomatedCommit(item)) continue; // skip bot commits
    mapped.push({
      sha: item.sha,
      message: firstLine(item.commit.message),
      dateIso: item.commit.author?.date ?? item.commit.committer?.date,
      url: item.html_url,
    });
  }
  return mapped;
}

/**
 * Merge commit records from several repos into newest-first commit view models,
 * de-duplicated by SHA and capped at `limit`.
 *
 * The ISO timestamp is baked verbatim rather than a formatted "2h ago": the
 * page formats it against the visitor's clock, so a build that goes a fortnight
 * without a rebuild shows a two-week-old age instead of freezing on "just now".
 */
export function buildRecentCommits(records, limit) {
  const seen = new Set();
  return records
    .filter((r) => r.dateIso && !seen.has(r.sha) && seen.add(r.sha))
    .sort((a, b) => b.dateIso.localeCompare(a.dateIso))
    .slice(0, limit)
    .map((r) => ({
      hash: r.sha.slice(0, SHORT_HASH_LENGTH),
      message: r.message,
      dateIso: r.dateIso,
      url: r.url,
    }));
}

/** GitHub GraphQL contributionLevel enum → our 0–4 HeatLevel. */
export function levelFromContribution(level) {
  switch (level) {
    case "FIRST_QUARTILE":
      return 1;
    case "SECOND_QUARTILE":
      return 2;
    case "THIRD_QUARTILE":
      return 3;
    case "FOURTH_QUARTILE":
      return 4;
    default:
      return 0;
  }
}

/**
 * Flatten the last `weekCount` weeks of a GraphQL contribution calendar into
 * heat cells (newest weeks kept so the strip fits the panel's ~15-week design).
 */
export function calendarCells(weeks, weekCount) {
  const recent = weeks.slice(-weekCount);
  const cells = [];
  for (const week of recent) {
    for (const day of week.contributionDays) {
      cells.push({
        level: levelFromContribution(day.contributionLevel),
        count: day.contributionCount,
        date: day.date,
      });
    }
  }
  return cells;
}

/**
 * Fetch public recent commits + repo count + profile URL (no token needed).
 *
 * Bot commits are filtered out, so the fetch reaches further than the feed it
 * fills: `scanDepth` commits are read per repo to see past a run of Dependabot
 * merges, and `maxRepos` covers repos whose recent pushes are all automated
 * (they still sort first by `pushed_at`). Each repo then contributes at most
 * `perRepo` commits, so one busy repo can't fill the whole panel. Cost is
 * 2 + `maxRepos` requests per bake.
 */
export async function fetchPublicActivity(login, options = {}) {
  const fetchImpl = options.fetch ?? fetch;
  const commitLimit = options.commitLimit ?? 6;
  const maxRepos = options.maxRepos ?? 8;
  const perRepo = options.perRepo ?? 4;
  const scanDepth = options.scanDepth ?? 30;
  const base = options.baseUrl ?? "https://api.github.com";
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "testingcharlie-build" };
  // Authenticate REST when a token is available: lifts the 60/hr unauthenticated
  // rate limit to 5,000/hr. selectRepos still filters to public repos, so this
  // never widens what's shown — it only makes the build resilient.
  if (options.token) headers.Authorization = `bearer ${options.token}`;
  const getJson = async (path) => {
    const res = await fetchImpl(`${base}${path}`, { headers });
    if (!res.ok) throw new Error(`GitHub REST ${path} → ${res.status}`);
    return res.json();
  };

  const [repos, user] = await Promise.all([
    getJson(`/users/${encodeURIComponent(login)}/repos?sort=pushed&direction=desc&type=owner&per_page=20`),
    getJson(`/users/${encodeURIComponent(login)}`),
  ]);

  // Read commits from the most-recently-pushed repos. The events endpoint no
  // longer carries commit details, and repos-by-pushed also picks up repos that
  // just became public without waiting for a fresh public PushEvent.
  const selected = selectRepos(repos, maxRepos);
  const perRepoCommits = await Promise.all(
    selected.map((repo) =>
      getJson(`/repos/${repo}/commits?per_page=${scanDepth}`)
        .then((restCommits) => mapRestCommits(restCommits).slice(0, perRepo))
        .catch(() => []),
    ),
  );

  return {
    commits: buildRecentCommits(perRepoCommits.flat(), commitLimit),
    publicRepoCount: user.public_repos,
    profileUrl: user.html_url,
  };
}

const CONTRIBUTIONS_QUERY = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount contributionLevel } }
      }
    }
  }
}`;

/** Fetch the real contribution calendar via authenticated GraphQL (token required). */
export async function fetchContributions(login, token, options = {}) {
  const fetchImpl = options.fetch ?? fetch;
  const weekCount = options.weekCount ?? 15;
  const url = options.graphqlUrl ?? "https://api.github.com/graphql";

  const res = await fetchImpl(url, {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "testingcharlie-build",
    },
    body: JSON.stringify({ query: CONTRIBUTIONS_QUERY, variables: { login } }),
  });
  if (!res.ok) {
    throw new Error(`GitHub GraphQL failed: ${res.status}`);
  }
  const body = await res.json();
  if (body.errors) {
    throw new Error(`GitHub GraphQL errors: ${JSON.stringify(body.errors)}`);
  }
  const calendar = body.data.user.contributionsCollection.contributionCalendar;
  return {
    total: calendar.totalContributions,
    cells: calendarCells(calendar.weeks, weekCount),
  };
}

/** Serialise baked activity into the TypeScript module src/seed.ts imports. */
export function renderManifest(data) {
  const commits = data.commits.map((c) => `  ${JSON.stringify(c)},`).join("\n");
  const cells = data.contributionCells.map((c) => `  ${JSON.stringify(c)},`).join("\n");

  return `// @generated by scripts/build-github-activity.mjs — do not edit by hand.
// Real GitHub activity, baked at build time. Public data (commits, repos) needs
// no token; the contribution calendar is populated only when GH_CONTRIB_TOKEN is
// set at build (0 / empty otherwise, so the panel shows repos, never a fake grid).
import type { Commit, ContributionCell } from "./types.js";

/** Recent commits read from the repos most recently pushed to, newest first. */
export const recentCommits: Commit[] = [${data.commits.length ? `\n${commits}\n` : ""}];

/** Public repository count. */
export const publicRepoCount = ${data.publicRepoCount};

/** Canonical GitHub profile URL. */
export const profileUrl = ${JSON.stringify(data.profileUrl)};

/** Real contributions in the last 12 months (0 until a build token is set). */
export const contributionTotal = ${data.contributionTotal};

/** Last ~15 weeks of real daily heat cells (empty until a build token is set). */
export const contributionCells: ContributionCell[] = [${data.contributionCells.length ? `\n${cells}\n` : ""}];

/** When this data was baked (ISO), for provenance. */
export const generatedAt = ${JSON.stringify(data.generatedAt)};
`;
}
