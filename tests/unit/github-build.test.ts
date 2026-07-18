import { describe, expect, it } from "vitest";
// Pure helpers of the build-time GitHub activity engine (plain ESM, run by Node
// in the build pipeline, never shipped to the browser).
import {
  buildRecentCommits,
  calendarCells,
  fetchPublicActivity,
  levelFromContribution,
  mapRestCommits,
  relativeTime,
  selectRepos,
} from "../../scripts/github.mjs";

describe("relativeTime", () => {
  const now = new Date("2026-07-17T12:00:00Z");
  it("buckets gaps into git-log-style strings", () => {
    expect(relativeTime(new Date("2026-07-17T11:59:30Z"), now)).toBe("just now");
    expect(relativeTime(new Date("2026-07-17T09:00:00Z"), now)).toBe("3h ago");
    expect(relativeTime(new Date("2026-07-16T12:00:00Z"), now)).toBe("yesterday");
    expect(relativeTime(new Date("2026-07-13T12:00:00Z"), now)).toBe("4d ago");
    expect(relativeTime(new Date("2026-06-01T12:00:00Z"), now)).toBe("1mo ago");
  });
});

describe("selectRepos", () => {
  it("keeps own, non-fork, non-archived repos in order, capped", () => {
    const repos = [
      { full_name: "a/one", fork: false, archived: false },
      { full_name: "a/afork", fork: true, archived: false },
      { full_name: "a/arch", fork: false, archived: true },
      { full_name: "a/two", fork: false, archived: false },
      { full_name: "a/three", fork: false, archived: false },
    ];
    expect(selectRepos(repos, 2)).toEqual(["a/one", "a/two"]);
  });
});

describe("mapRestCommits", () => {
  const rest = [
    {
      sha: "aaaaaa11",
      html_url: "https://github.com/a/r/commit/aaaaaa11",
      parents: [{}],
      commit: { message: "feat: thing\n\nbody", author: { date: "2026-07-10T00:00:00Z" } },
    },
    {
      sha: "merge999",
      html_url: "https://github.com/a/r/commit/merge999",
      parents: [{}, {}], // merge commit → dropped
      commit: { message: "Merge pull request #1", author: { date: "2026-07-11T00:00:00Z" } },
    },
  ];

  it("keeps the first message line and drops merge commits", () => {
    const mapped = mapRestCommits(rest);
    expect(mapped).toHaveLength(1);
    expect(mapped[0]).toMatchObject({ sha: "aaaaaa11", message: "feat: thing", dateIso: "2026-07-10T00:00:00Z" });
  });
});

describe("buildRecentCommits", () => {
  const now = new Date("2026-07-17T00:00:00Z");
  const records = [
    { sha: "bbbbbb22", message: "older", dateIso: "2026-07-10T00:00:00Z", url: "u2" },
    { sha: "aaaaaa11", message: "newer", dateIso: "2026-07-16T00:00:00Z", url: "u1" },
    { sha: "aaaaaa11", message: "dupe", dateIso: "2026-07-16T00:00:00Z", url: "u1" }, // same SHA
  ];

  it("sorts newest-first, de-dupes by SHA, caps, and shortens the hash", () => {
    const commits = buildRecentCommits(records, now, 5);
    expect(commits.map((c: { message: string }) => c.message)).toEqual(["newer", "older"]);
    expect(commits[0]).toMatchObject({ hash: "aaaaaa", relativeTime: "yesterday", url: "u1" });
  });

  it("respects the limit", () => {
    expect(buildRecentCommits(records, now, 1)).toHaveLength(1);
  });
});

describe("levelFromContribution", () => {
  it("maps the GraphQL enum to 0–4", () => {
    expect(levelFromContribution("NONE")).toBe(0);
    expect(levelFromContribution("FIRST_QUARTILE")).toBe(1);
    expect(levelFromContribution("FOURTH_QUARTILE")).toBe(4);
    expect(levelFromContribution("UNKNOWN")).toBe(0);
  });
});

describe("calendarCells", () => {
  it("flattens the last N weeks into dated heat cells", () => {
    const weeks = [
      { contributionDays: [{ date: "2026-01-01", contributionCount: 0, contributionLevel: "NONE" }] },
      { contributionDays: [{ date: "2026-07-01", contributionCount: 7, contributionLevel: "THIRD_QUARTILE" }] },
    ];
    const cells = calendarCells(weeks, 1); // keep only the last week
    expect(cells).toEqual([{ level: 3, count: 7, date: "2026-07-01" }]);
  });
});

describe("fetchPublicActivity", () => {
  const now = new Date("2026-07-17T12:00:00Z");
  const baseUrl = "https://api.test";

  // A private repo sits between two public ones to prove it never reaches the
  // /commits stage — the security guarantee an authenticated build depends on.
  const repos = [
    { full_name: "me/public-new", fork: false, archived: false, private: false },
    { full_name: "me/secret", fork: false, archived: false, private: true },
    { full_name: "me/public-old", fork: false, archived: false, private: false },
  ];
  const user = { login: "me", html_url: "https://github.com/me", public_repos: 12, name: "Me" };
  const commitsByRepo: Record<string, unknown[]> = {
    "me/public-new": [
      {
        sha: "newsha0001",
        html_url: "https://github.com/me/public-new/commit/newsha0001",
        parents: [{}],
        commit: { message: "newer\n\nbody", author: { date: "2026-07-16T00:00:00Z" } },
      },
    ],
    "me/public-old": [
      {
        sha: "oldsha0002",
        html_url: "https://github.com/me/public-old/commit/oldsha0002",
        parents: [{}],
        commit: { message: "older", author: { date: "2026-07-10T00:00:00Z" } },
      },
    ],
  };

  /** A fetch that records every request's URL + headers and serves fixtures by path. */
  function recordingFetch(): { fetchImpl: typeof fetch; calls: { url: string; headers: Record<string, string> }[] } {
    const calls: { url: string; headers: Record<string, string> }[] = [];
    const fetchImpl = (async (url: string, init: { headers?: Record<string, string> } = {}) => {
      calls.push({ url, headers: init.headers ?? {} });
      const repo = url.match(/\/repos\/([^/]+\/[^/]+)\/commits/)?.[1] ?? "";
      const body = url.includes("/commits") ? (commitsByRepo[repo] ?? []) : url.includes("/repos?") ? repos : user;
      return { ok: true, status: 200, json: async () => body };
    }) as unknown as typeof fetch;
    return { fetchImpl, calls };
  }

  it("authenticates every REST call and returns real public activity when a token is set", async () => {
    const { fetchImpl, calls } = recordingFetch();
    const result = await fetchPublicActivity("me", { fetch: fetchImpl, baseUrl, now, token: "secret-pat" });

    // Every request carries the bearer token (lifts the 60/hr anonymous limit).
    expect(calls.length).toBeGreaterThan(0);
    for (const call of calls) {
      expect(call.headers.Authorization).toBe("bearer secret-pat");
    }
    // Repos are picked from the pushed-sorted repos endpoint (not the events feed).
    expect(calls[0]?.url).toContain("/users/me/repos?sort=pushed");
    // Commits come back merged + newest-first, from the public repos only.
    expect(result.commits.map((c: { message: string }) => c.message)).toEqual(["newer", "older"]);
    expect(result.publicRepoCount).toBe(12);
    expect(result.profileUrl).toBe("https://github.com/me");
  });

  it("never fetches commits from a private repo, even on an authenticated build", async () => {
    const { fetchImpl, calls } = recordingFetch();
    await fetchPublicActivity("me", { fetch: fetchImpl, baseUrl, now, token: "secret-pat" });

    // selectRepos drops the private repo, so its /commits endpoint is never hit.
    expect(calls.some((c) => c.url.includes("me/secret"))).toBe(false);
    expect(calls.some((c) => c.url.includes("me/public-new/commits"))).toBe(true);
    expect(calls.some((c) => c.url.includes("me/public-old/commits"))).toBe(true);
  });

  it("sends no Authorization header when no token is provided", async () => {
    const { fetchImpl, calls } = recordingFetch();
    await fetchPublicActivity("me", { fetch: fetchImpl, baseUrl, now });

    expect(calls.length).toBeGreaterThan(0);
    for (const call of calls) {
      expect(call.headers.Authorization).toBeUndefined();
    }
  });
});
