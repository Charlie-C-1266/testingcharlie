import type { GitHubClient } from "./github/client.js";
import type { ActivityData } from "./types.js";

/** Provides the recent-activity data: a synchronous seed plus live hydration. */
export interface DataSource {
  /** Data available immediately, for the first paint. */
  initial(): ActivityData;
  /** Resolve live data, falling back to the seed on any failure. */
  hydrate(): Promise<ActivityData>;
}

/** Dependencies for {@link LiveDataSource}. */
export interface LiveDataSourceOptions {
  client: GitHubClient;
  seed: ActivityData;
  /** How many commits to request for the git-log panel (default 5). */
  commitLimit?: number;
}

/**
 * Composes seed content with live GitHub data. Each live field is applied only
 * when its request succeeds, so a partial outage still shows the seed for the
 * pieces that failed — the page is never left blank or half-broken.
 */
export class LiveDataSource implements DataSource {
  private readonly client: GitHubClient;
  private readonly seed: ActivityData;
  private readonly commitLimit: number;

  constructor(options: LiveDataSourceOptions) {
    this.client = options.client;
    this.seed = options.seed;
    this.commitLimit = options.commitLimit ?? 5;
  }

  initial(): ActivityData {
    return this.seed;
  }

  async hydrate(): Promise<ActivityData> {
    const [commitsResult, profileResult] = await Promise.allSettled([
      this.client.getRecentCommits(this.commitLimit),
      this.client.getProfile(),
    ]);

    const commits =
      commitsResult.status === "fulfilled" && commitsResult.value.length > 0
        ? commitsResult.value
        : this.seed.commits;

    const github =
      profileResult.status === "fulfilled"
        ? {
            ...this.seed.github,
            profileUrl: profileResult.value.html_url,
            repoCount: profileResult.value.public_repos,
          }
        : this.seed.github;

    return { commits, github };
  }
}
