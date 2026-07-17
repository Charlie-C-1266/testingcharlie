import { describe, expect, it } from "vitest";
import { heatLevel, mapEventsToCommits } from "../../../src/github/mappers.js";
import type { GitHubEvent } from "../../../src/github/api-types.js";

const now = new Date("2026-07-17T12:00:00Z");

function pushEvent(
  commits: { sha: string; message: string }[],
  createdAt = "2026-07-17T10:00:00Z",
  repo?: string,
): GitHubEvent {
  const event: GitHubEvent = { type: "PushEvent", created_at: createdAt, payload: { commits } };
  if (repo) {
    (event as unknown as { repo: { name: string } }).repo = { name: repo };
  }
  return event;
}

describe("mapEventsToCommits", () => {
  it("flattens push commits newest-first with short hashes and relative time", () => {
    const events = [
      pushEvent(
        [
          { sha: "aaaaaaaa1111", message: "first" },
          { sha: "bbbbbbbb2222", message: "second" },
        ],
        "2026-07-17T10:00:00Z",
        "charlie/repo",
      ),
    ];
    const commits = mapEventsToCommits(events, now, 5);
    expect(commits).toHaveLength(2);
    expect(commits[0]).toMatchObject({ hash: "bbbbbb", message: "second", relativeTime: "2h ago" });
    expect(commits[0]?.url).toBe("https://github.com/charlie/repo/commit/bbbbbbbb2222");
    expect(commits[1]?.hash).toBe("aaaaaa");
  });

  it("skips non-push events and push events without commits", () => {
    const events: GitHubEvent[] = [
      { type: "WatchEvent", created_at: "2026-07-17T09:00:00Z", payload: {} },
      { type: "PushEvent", created_at: "2026-07-17T09:00:00Z", payload: {} },
      pushEvent([{ sha: "cccccccc3333", message: "kept" }]),
    ];
    const commits = mapEventsToCommits(events, now, 5);
    expect(commits).toHaveLength(1);
    expect(commits[0]?.message).toBe("kept");
  });

  it("omits the url when the event has no repo", () => {
    const commits = mapEventsToCommits([pushEvent([{ sha: "dddddddd4444", message: "no repo" }])], now, 5);
    expect(commits[0]?.url).toBeUndefined();
  });

  it("uses only the first line of a commit message", () => {
    const commits = mapEventsToCommits(
      [pushEvent([{ sha: "eeeeeeee5555", message: "subject line\n\nbody text" }])],
      now,
      5,
    );
    expect(commits[0]?.message).toBe("subject line");
  });

  it("respects the limit across events", () => {
    const events = [
      pushEvent([
        { sha: "1", message: "a" },
        { sha: "2", message: "b" },
        { sha: "3", message: "c" },
      ]),
    ];
    expect(mapEventsToCommits(events, now, 2)).toHaveLength(2);
    expect(mapEventsToCommits(events, now, 0)).toHaveLength(0);
  });
});

describe("heatLevel", () => {
  it("maps counts onto the four intensities", () => {
    expect(heatLevel(0)).toBe(0);
    expect(heatLevel(-4)).toBe(0);
    expect(heatLevel(1)).toBe(1);
    expect(heatLevel(2)).toBe(1);
    expect(heatLevel(3)).toBe(2);
    expect(heatLevel(5)).toBe(2);
    expect(heatLevel(6)).toBe(3);
    expect(heatLevel(9)).toBe(3);
    expect(heatLevel(10)).toBe(4);
    expect(heatLevel(50)).toBe(4);
  });
});
