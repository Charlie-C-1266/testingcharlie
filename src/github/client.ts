import type { Commit } from "../types.js";
import type { GitHubEvent, GitHubUser } from "./api-types.js";
import { mapEventsToCommits } from "./mappers.js";

/** Error thrown when a GitHub request returns a non-2xx status. */
export class GitHubError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "GitHubError";
  }
}

/** Dependencies + settings for {@link GitHubClient}, all injectable. */
export interface GitHubClientOptions {
  /** GitHub account login to read from. */
  username: string;
  /** `fetch` implementation (default: global fetch). */
  fetch?: typeof fetch;
  /** API base URL (default: https://api.github.com). */
  baseUrl?: string;
  /** Clock, for turning commit timestamps into relative strings. */
  now?: () => Date;
}

const DEFAULT_BASE_URL = "https://api.github.com";
const EVENTS_PAGE_SIZE = 30;

/**
 * A thin, dependency-injected wrapper over the public GitHub REST API. Only
 * the unauthenticated endpoints are used, so no token is required (and none is
 * ever embedded in the shipped, client-side code).
 */
export class GitHubClient {
  private readonly username: string;
  private readonly fetchFn: typeof fetch;
  private readonly baseUrl: string;
  private readonly now: () => Date;

  constructor(options: GitHubClientOptions) {
    this.username = options.username;
    this.fetchFn = options.fetch ?? fetch.bind(globalThis);
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.now = options.now ?? ((): Date => new Date());
  }

  /** Fetch the user's public profile (repo count, handle, …). */
  async getProfile(): Promise<GitHubUser> {
    return this.request<GitHubUser>(`/users/${encodeURIComponent(this.username)}`);
  }

  /** Fetch the user's most recent commits, derived from public push events. */
  async getRecentCommits(limit = 5): Promise<Commit[]> {
    const path = `/users/${encodeURIComponent(this.username)}/events/public?per_page=${EVENTS_PAGE_SIZE}`;
    const events = await this.request<GitHubEvent[]>(path);
    return mapEventsToCommits(events, this.now(), limit);
  }

  private async request<T>(path: string): Promise<T> {
    const response = await this.fetchFn(`${this.baseUrl}${path}`, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!response.ok) {
      throw new GitHubError(`GitHub request failed: ${path}`, response.status);
    }
    return (await response.json()) as T;
  }
}
