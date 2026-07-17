import { describe, expect, it, vi } from "vitest";
import { LiveDataSource } from "../../src/data-source.js";
import { GitHubClient } from "../../src/github/client.js";
import type { ActivityData, Commit } from "../../src/types.js";
import type { GitHubUser } from "../../src/github/api-types.js";

const seed: ActivityData = {
  commits: [{ hash: "seed01", message: "seed commit", relativeTime: "1w ago" }],
  github: {
    handle: "@seed",
    profileUrl: "https://github.com/seed",
    contributions: [{ level: 1, count: 2 }],
    contributionCount: 100,
    repoCount: 5,
  },
};

const liveCommits: Commit[] = [{ hash: "live01", message: "live commit", relativeTime: "2h ago" }];
const liveProfile: GitHubUser = {
  login: "charlie",
  html_url: "https://github.com/charlie",
  public_repos: 34,
  name: "Charlie",
};

function makeClient(overrides: Partial<Record<"getRecentCommits" | "getProfile", unknown>>): GitHubClient {
  const client = Object.create(GitHubClient.prototype) as GitHubClient;
  return Object.assign(client, overrides) as GitHubClient;
}

describe("LiveDataSource", () => {
  it("returns the seed synchronously", () => {
    const source = new LiveDataSource({ client: makeClient({}), seed });
    expect(source.initial()).toBe(seed);
  });

  it("merges live commits and live repo count on success", async () => {
    const getRecentCommits = vi.fn().mockResolvedValue(liveCommits);
    const getProfile = vi.fn().mockResolvedValue(liveProfile);
    const source = new LiveDataSource({ client: makeClient({ getRecentCommits, getProfile }), seed, commitLimit: 3 });

    const data = await source.hydrate();
    expect(getRecentCommits).toHaveBeenCalledWith(3);
    expect(data.commits).toEqual(liveCommits);
    expect(data.github.repoCount).toBe(34);
    expect(data.github.profileUrl).toBe("https://github.com/charlie");
    // Branding fields from the seed are preserved.
    expect(data.github.handle).toBe("@seed");
    expect(data.github.contributions).toBe(seed.github.contributions);
  });

  it("keeps seed commits when the live list is empty", async () => {
    const source = new LiveDataSource({
      client: makeClient({
        getRecentCommits: vi.fn().mockResolvedValue([]),
        getProfile: vi.fn().mockResolvedValue(liveProfile),
      }),
      seed,
    });
    const data = await source.hydrate();
    expect(data.commits).toBe(seed.commits);
    expect(data.github.repoCount).toBe(34);
  });

  it("falls back to seed github when the profile request fails", async () => {
    const source = new LiveDataSource({
      client: makeClient({
        getRecentCommits: vi.fn().mockResolvedValue(liveCommits),
        getProfile: vi.fn().mockRejectedValue(new Error("rate limited")),
      }),
      seed,
    });
    const data = await source.hydrate();
    expect(data.commits).toEqual(liveCommits);
    expect(data.github).toBe(seed.github);
  });

  it("falls back entirely to the seed when everything fails", async () => {
    const source = new LiveDataSource({
      client: makeClient({
        getRecentCommits: vi.fn().mockRejectedValue(new Error("offline")),
        getProfile: vi.fn().mockRejectedValue(new Error("offline")),
      }),
      seed,
    });
    const data = await source.hydrate();
    expect(data.commits).toBe(seed.commits);
    expect(data.github).toBe(seed.github);
  });
});
