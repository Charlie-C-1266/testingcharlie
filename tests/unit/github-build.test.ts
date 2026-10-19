import { describe, expect, it } from "vitest";
// Pure helpers of the build-time GitHub activity engine (plain ESM, run by Node
// in the build pipeline, never shipped to the browser).
import {
  buildRecentCommits,
  calendarCells,
  fetchPublicActivity,
  isAutomatedCommit,
  levelFromContribution,
  mapRestCommits,
  selectRepos,
} from "../../scripts/github.mjs";

type RestAuthor = { login?: string; type?: string } | null;

/** A `/commits` REST item carrying only the fields the build reads. */
function restCommit(sha: string, message: string, date: string, author: RestAuthor = null, email = "dev@example.com") {
  return {
    sha,
    html_url: `https://github.com/a/r/commit/${sha}`,
    parents: [{}],
    author,
    commit: { message, author: { date, email } },
  };
}

const DATE = "2026-10-15T20:21:51Z";
const OWNER: RestAuthor = { login: "Charlie-C-1266", type: "User" };
const DEPENDABOT: RestAuthor = { login: "dependabot[bot]", type: "Bot" };

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

  it("drops automated commits and keeps the human ones in order", () => {
    const mapped = mapRestCommits([
      restCommit("bump0001", "build(deps): Bump qs and express (#49)", DATE, DEPENDABOT),
      restCommit("real0001", "Add a quick toggle (#179)", DATE, OWNER),
      restCommit("gen00001", "Update generated files", DATE, null, "github-stats[bot]@jstrieb.github.io"),
      restCommit("real0002", "Fix the hero copy", DATE, OWNER),
    ]);
    expect(mapped.map((c: { sha: string }) => c.sha)).toEqual(["real0001", "real0002"]);
  });
});

describe("isAutomatedCommit", () => {
  it.each([
    [
      "a linked bot account (Dependabot)",
      restCommit(
        "d1",
        "build(deps): Bump qs (#49)",
        DATE,
        DEPENDABOT,
        "49699333+dependabot[bot]@users.noreply.github.com",
      ),
    ],
    [
      "a [bot] login even when the account type is missing",
      restCommit("r1", "chore: update", DATE, { login: "renovate[bot]" }),
    ],
    [
      "a Bot account type even without a [bot] login",
      restCommit("b1", "sync", DATE, { login: "some-app", type: "Bot" }),
    ],
    [
      "an unlinked bot known only by its [bot] email",
      restCommit("g1", "Update generated files", DATE, null, "github-stats[bot]@jstrieb.github.io"),
    ],
    [
      "github-actions committing from its noreply address",
      restCommit("a1", "chore: refresh", DATE, null, "41898282+github-actions[bot]@users.noreply.github.com"),
    ],
  ])("flags %s", (_label, item) => {
    expect(isAutomatedCommit(item)).toBe(true);
  });

  it.each([
    ["the profile owner's own commit", restCommit("c1", "Add a quick toggle (#179)", DATE, OWNER, "me@example.com")],
    [
      "a commit authored through an assistant's account",
      restCommit(
        "c2",
        "Add Python dev container template",
        DATE,
        { login: "claude", type: "User" },
        "noreply@anthropic.com",
      ),
    ],
    [
      "a human commit from an email not linked to any account",
      restCommit("c3", "Updates", DATE, null, "me@example.com"),
    ],
    [
      "a human commit whose message reads like a bot's",
      restCommit("c4", "build(deps): Bump vitest by hand", DATE, OWNER),
    ],
  ])("keeps %s", (_label, item) => {
    expect(isAutomatedCommit(item)).toBe(false);
  });

  it("judges the author, not the committer (bots that commit human work keep it)", () => {
    const item = {
      ...restCommit("c5", "Rebased feature", DATE, OWNER),
      committer: { login: "github-actions[bot]", type: "Bot" },
    };
    expect(isAutomatedCommit(item)).toBe(false);
  });

  it("treats a commit with no author identity at all as human", () => {
    expect(isAutomatedCommit({ sha: "x", parents: [{}], commit: { message: "initial" } })).toBe(false);
  });
});

describe("buildRecentCommits", () => {
  const records = [
    { sha: "bbbbbb22", message: "older", dateIso: "2026-07-10T00:00:00Z", url: "u2" },
    { sha: "aaaaaa11", message: "newer", dateIso: "2026-07-16T00:00:00Z", url: "u1" },
    { sha: "aaaaaa11", message: "dupe", dateIso: "2026-07-16T00:00:00Z", url: "u1" }, // same SHA
  ];

  it("sorts newest-first, de-dupes by SHA, caps, and shortens the hash", () => {
    const commits = buildRecentCommits(records, 5);
    expect(commits.map((c: { message: string }) => c.message)).toEqual(["newer", "older"]);
    expect(commits[0]).toMatchObject({ hash: "aaaaaa", dateIso: "2026-07-16T00:00:00Z", url: "u1" });
  });

  it("bakes the raw timestamp, never a pre-formatted age", () => {
    for (const commit of buildRecentCommits(records, 5)) {
      expect(commit).not.toHaveProperty("relativeTime");
      expect(commit.dateIso).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });

  it("respects the limit", () => {
    expect(buildRecentCommits(records, 1)).toHaveLength(1);
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

  type Fixtures = { repos: unknown[]; commitsByRepo: Record<string, unknown[]> };

  /** A fetch that records every request's URL + headers and serves fixtures by path. */
  function recordingFetch(fixtures: Fixtures = { repos, commitsByRepo }): {
    fetchImpl: typeof fetch;
    calls: { url: string; headers: Record<string, string> }[];
  } {
    const calls: { url: string; headers: Record<string, string> }[] = [];
    const fetchImpl = (async (url: string, init: { headers?: Record<string, string> } = {}) => {
      calls.push({ url, headers: init.headers ?? {} });
      const repo = url.match(/\/repos\/([^/]+\/[^/]+)\/commits/)?.[1] ?? "";
      const body = url.includes("/commits")
        ? (fixtures.commitsByRepo[repo] ?? [])
        : url.includes("/repos?")
          ? fixtures.repos
          : user;
      return { ok: true, status: 200, json: async () => body };
    }) as unknown as typeof fetch;
    return { fetchImpl, calls };
  }

  /** A public, own, active repo as the repos endpoint lists it. */
  const publicRepo = (full_name: string) => ({ full_name, fork: false, archived: false, private: false });
  /** `count` Dependabot commits, all newer than any human work in the fixtures. */
  const bumps = (repo: string, count: number) =>
    Array.from({ length: count }, (_, i) =>
      restCommit(`${repo}-bump${i}`, `build(deps): Bump dep${i}`, `2026-10-18T0${i}:00:00Z`, DEPENDABOT),
    );
  const messages = (commits: { message: string }[]) => commits.map((c) => c.message);

  it("reads past a run of bot commits and caps how many commits one repo contributes", async () => {
    const { fetchImpl, calls } = recordingFetch({
      // Pushed order: bot-only repo first, then a repo whose newest 8 commits are bumps.
      repos: [publicRepo("me/stats"), publicRepo("me/site"), publicRepo("me/app")],
      commitsByRepo: {
        "me/stats": [restCommit("gen1", "Update generated files", "2026-10-19T03:00:00Z", null, "stats[bot]@x.io")],
        "me/site": [
          ...bumps("site", 8),
          restCommit("site-h1", "site: real work", "2026-10-09T00:00:00Z", OWNER),
          restCommit("site-h2", "site: older work", "2026-10-08T00:00:00Z", OWNER),
        ],
        "me/app": Array.from({ length: 6 }, (_, i) =>
          restCommit(`app-h${i}`, `app: change ${i}`, `2026-10-1${5 - i}T00:00:00Z`, OWNER),
        ),
      },
    });
    const result = await fetchPublicActivity("me", { fetch: fetchImpl, baseUrl, now });

    // Each repo is read deep enough to see past the run of bumps.
    expect(calls.filter((c) => c.url.includes("/commits")).every((c) => c.url.includes("per_page=30"))).toBe(true);
    // Six human commits: me/app's six are capped at four, and me/site's work behind the bumps fills the rest.
    expect(messages(result.commits)).toEqual([
      "app: change 0",
      "app: change 1",
      "app: change 2",
      "app: change 3",
      "site: real work",
      "site: older work",
    ]);
  });

  it("scans past bot-only repos crowding the top of the pushed order", async () => {
    const botRepos = ["me/b1", "me/b2", "me/b3", "me/b4"];
    const { fetchImpl } = recordingFetch({
      repos: [...botRepos.map(publicRepo), publicRepo("me/real")],
      commitsByRepo: {
        ...Object.fromEntries(botRepos.map((repo) => [repo, bumps(repo, 3)])),
        "me/real": [restCommit("real1", "The work that matters", "2026-09-01T00:00:00Z", OWNER)],
      },
    });
    const result = await fetchPublicActivity("me", { fetch: fetchImpl, baseUrl, now });

    expect(messages(result.commits)).toEqual(["The work that matters"]);
  });

  it("bakes no bot commits even when they are all that's recent", async () => {
    const { fetchImpl } = recordingFetch({
      repos: [publicRepo("me/site")],
      commitsByRepo: { "me/site": bumps("site", 5) },
    });
    const result = await fetchPublicActivity("me", { fetch: fetchImpl, baseUrl, now });

    // An honest empty feed, never a changelog of dependency bumps.
    expect(result.commits).toEqual([]);
  });

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
