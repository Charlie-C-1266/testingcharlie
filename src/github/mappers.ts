import { relativeTime } from "../time.js";
import type { Commit, HeatLevel } from "../types.js";
import type { GitHubEvent } from "./api-types.js";

/** How many hex characters of a commit SHA to show (matches the design). */
const SHORT_HASH_LENGTH = 6;

/** GitHub's commit view URL for a given repo + sha. */
function commitUrl(repo: string, sha: string): string {
  return `https://github.com/${repo}/commit/${sha}`;
}

/** First line of a commit message (git-log --oneline style). */
function firstLine(message: string): string {
  const newline = message.indexOf("\n");
  return newline === -1 ? message : message.slice(0, newline);
}

/**
 * The repo name (`owner/name`) for a push event, if present. Kept defensive
 * because the `repo` field is not part of our narrowed event type.
 */
function eventRepoName(event: GitHubEvent): string | undefined {
  const repo = (event as { repo?: { name?: string } }).repo;
  return repo?.name;
}

/**
 * Flatten recent public PushEvents into commit view models, newest first,
 * capped at `limit`. Each commit's timestamp comes from its push event, which
 * is close enough for a "recent activity" list.
 */
export function mapEventsToCommits(
  events: readonly GitHubEvent[],
  now: Date,
  limit: number,
): Commit[] {
  const commits: Commit[] = [];
  if (limit <= 0) {
    return commits;
  }

  for (const event of events) {
    if (event.type !== "PushEvent" || !event.payload.commits) {
      continue;
    }
    const time = relativeTime(new Date(event.created_at), now);
    const repo = eventRepoName(event);

    // GitHub lists a push's commits oldest-first; reverse for newest-first.
    for (const raw of [...event.payload.commits].reverse()) {
      const commit: Commit = {
        hash: raw.sha.slice(0, SHORT_HASH_LENGTH),
        message: firstLine(raw.message),
        relativeTime: time,
      };
      if (repo) {
        commit.url = commitUrl(repo, raw.sha);
      }
      commits.push(commit);
      if (commits.length >= limit) {
        return commits;
      }
    }
  }

  return commits;
}

/**
 * Map a day's contribution count to a heat level 0–4, matching the four
 * green intensities in the design (empty → hottest).
 */
export function heatLevel(count: number): HeatLevel {
  if (count <= 0) {
    return 0;
  }
  if (count < 3) {
    return 1;
  }
  if (count < 6) {
    return 2;
  }
  if (count < 10) {
    return 3;
  }
  return 4;
}
