import { describe, expect, it } from "vitest";
import { GitHubClient, GitHubError } from "../../../src/github/client.js";
import type { GitHubEvent, GitHubUser } from "../../../src/github/api-types.js";
import { fakeFetch, jsonResponse } from "../helpers.js";

const profile: GitHubUser = {
  login: "octocat",
  html_url: "https://github.com/octocat",
  public_repos: 42,
  name: "The Octocat",
};

describe("GitHubClient.getProfile", () => {
  it("requests the user endpoint and returns the profile", async () => {
    const urls: string[] = [];
    const client = new GitHubClient({
      username: "octo cat",
      baseUrl: "https://api.test",
      fetch: fakeFetch((url) => {
        urls.push(url);
        return jsonResponse(profile);
      }),
    });

    await expect(client.getProfile()).resolves.toEqual(profile);
    expect(urls[0]).toBe("https://api.test/users/octo%20cat");
  });

  it("throws a GitHubError on a non-2xx response", async () => {
    const client = new GitHubClient({
      username: "octocat",
      fetch: fakeFetch(jsonResponse({}, { ok: false, status: 404 })),
    });

    await expect(client.getProfile()).rejects.toBeInstanceOf(GitHubError);
    await expect(client.getProfile()).rejects.toMatchObject({ status: 404, name: "GitHubError" });
  });
});

describe("GitHubClient.getRecentCommits", () => {
  const events: GitHubEvent[] = [
    {
      type: "PushEvent",
      created_at: new Date().toISOString(),
      payload: { commits: [{ sha: "abcdef123456", message: "live commit" }] },
    },
  ];

  it("maps public events into commits", async () => {
    const client = new GitHubClient({
      username: "octocat",
      fetch: fakeFetch(jsonResponse(events)),
    });
    const commits = await client.getRecentCommits(3);
    expect(commits).toHaveLength(1);
    expect(commits[0]).toMatchObject({ hash: "abcdef", message: "live commit" });
  });

  it("defaults the limit and uses the default clock", async () => {
    const client = new GitHubClient({ username: "octocat", fetch: fakeFetch(jsonResponse(events)) });
    const commits = await client.getRecentCommits();
    expect(commits[0]?.relativeTime).toBe("just now");
  });
});

describe("GitHubClient construction", () => {
  it("builds with the default fetch and base URL", () => {
    const client = new GitHubClient({ username: "octocat" });
    expect(client).toBeInstanceOf(GitHubClient);
  });
});
