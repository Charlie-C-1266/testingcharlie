// Minimal shapes for the slices of the GitHub REST API this site consumes.
// Only the fields actually read are declared; the API returns far more.

/** `GET /users/{username}` (subset). */
export interface GitHubUser {
  login: string;
  html_url: string;
  public_repos: number;
  name: string | null;
}

/** A single commit inside a PushEvent payload. */
export interface GitHubPushCommit {
  sha: string;
  message: string;
}

/** An entry from `GET /users/{username}/events/public` (subset). */
export interface GitHubEvent {
  type: string;
  created_at: string;
  payload: {
    commits?: GitHubPushCommit[];
  };
}
