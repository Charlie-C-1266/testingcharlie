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
const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/** Mirror of src/time.ts relativeTime, for baking commit timestamps at build. */
export function relativeTime(date, now) {
  const seconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
  if (seconds < MINUTE) return "just now";
  if (seconds < HOUR) return `${Math.floor(seconds / MINUTE)}m ago`;
  if (seconds < DAY) return `${Math.floor(seconds / HOUR)}h ago`;
  const days = Math.floor(seconds / DAY);
  if (days === 1) return "yesterday";
  if (seconds < WEEK) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

/** First line of a commit message (git-log --oneline style). */
function firstLine(message) {
  const newline = message.indexOf("\n");
  return newline === -1 ? message : message.slice(0, newline);
}

/** Distinct `owner/repo` names of recent public PushEvents, newest first. */
export function distinctPushedRepos(events, max) {
  const repos = [];
  for (const event of events) {
    if (event.type !== "PushEvent") continue;
    const name = event.repo?.name;
    if (name && !repos.includes(name)) {
      repos.push(name);
      if (repos.length >= max) break;
    }
  }
  return repos;
}

/**
 * Map a repo's `/commits` REST response to lightweight commit records, dropping
 * merge commits (2+ parents) for a clean `git log --no-merges` style feed.
 */
export function mapRestCommits(restCommits) {
  const mapped = [];
  for (const item of restCommits) {
    if ((item.parents?.length ?? 0) > 1) continue; // skip merge commits
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
 */
export function buildRecentCommits(records, now, limit) {
  const seen = new Set();
  return records
    .filter((r) => r.dateIso && !seen.has(r.sha) && seen.add(r.sha))
    .sort((a, b) => b.dateIso.localeCompare(a.dateIso))
    .slice(0, limit)
    .map((r) => ({
      hash: r.sha.slice(0, SHORT_HASH_LENGTH),
      message: r.message,
      relativeTime: relativeTime(new Date(r.dateIso), now),
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

/** Fetch public recent commits + repo count + profile URL (no token needed). */
export async function fetchPublicActivity(login, options = {}) {
  const fetchImpl = options.fetch ?? fetch;
  const now = options.now ?? new Date();
  const commitLimit = options.commitLimit ?? 6;
  const maxRepos = options.maxRepos ?? 3;
  const perRepo = options.perRepo ?? 4;
  const base = options.baseUrl ?? "https://api.github.com";
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "testingcharlie-build" };
  const getJson = async (path) => {
    const res = await fetchImpl(`${base}${path}`, { headers });
    if (!res.ok) throw new Error(`GitHub REST ${path} → ${res.status}`);
    return res.json();
  };

  const [events, user] = await Promise.all([
    getJson(`/users/${encodeURIComponent(login)}/events/public?per_page=30`),
    getJson(`/users/${encodeURIComponent(login)}`),
  ]);

  // The events payload no longer carries commit details, so read commits from
  // the repos the user most recently pushed to.
  const repos = distinctPushedRepos(events, maxRepos);
  const perRepoCommits = await Promise.all(
    repos.map((repo) =>
      getJson(`/repos/${repo}/commits?per_page=${perRepo}`)
        .then(mapRestCommits)
        .catch(() => []),
    ),
  );

  return {
    commits: buildRecentCommits(perRepoCommits.flat(), now, commitLimit),
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
  const commits = data.commits
    .map((c) => `  ${JSON.stringify(c)},`)
    .join("\n");
  const cells = data.contributionCells
    .map((c) => `  ${JSON.stringify(c)},`)
    .join("\n");

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
