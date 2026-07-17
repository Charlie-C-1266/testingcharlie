// Domain model for the site. These are compile-time-only shapes: `tsc` erases
// the file when emitting JavaScript. Everything the UI renders is described
// here, so a typo in the data or a render function is caught before it ships.

/** The only piece of persistent UI state. */
export type Theme = "light" | "dark";

/** GitHub contribution-cell intensity, 0 (empty) … 4 (hottest). */
export type HeatLevel = 0 | 1 | 2 | 3 | 4;

/** A link shown in the nav or elsewhere. */
export interface NavItem {
  label: string;
  href: string;
}

/** A social link in the footer. */
export interface SocialLink {
  label: string;
  href: string;
}

/** A mono chip such as "GitHub ↗" or a `mailto:` contact. */
export interface ContactChip {
  label: string;
  href: string;
}

/** Site identity and outbound links / settings the owner edits by hand. */
export interface Identity {
  /** Brand text, e.g. "testingcharlie". */
  brand: string;
  /** Top-level domain suffix rendered faint, e.g. ".co.uk". */
  brandTld: string;
  /** Primary contact address (used for all `mailto:` links). */
  email: string;
  /** Real GitHub account used for the live API (e.g. "Charlie-C-1266"). */
  githubUsername: string;
  /** Display handle shown in the GitHub panel (e.g. "@testingcharlie"). */
  githubHandle: string;
  /** Public GitHub profile URL. */
  githubUrl: string;
  /** Shell username shown in terminal prompts (e.g. "charlie"). */
  shellUser: string;
  /** Shell hostname shown in terminal prompts (e.g. "testing"). */
  shellHost: string;
}

/** Hero (section 2) editorial content. */
export interface HeroContent {
  kicker: string;
  /** Title split across lines; a trailing accent "." is added by the renderer. */
  titleLines: string[];
  lead: string;
  chips: ContactChip[];
}

/** A single CI stat chip in the pipeline panel. */
export interface CiStat {
  value: string;
  label: string;
  /** When true the number is rendered in the strong-green accent colour. */
  emphasis?: boolean;
}

/** CI/CD pipeline panel content. */
export interface PipelineContent {
  /** Stage labels, all treated as passing, e.g. ["build","lint","test","deploy"]. */
  stages: string[];
  stats: CiStat[];
}

/** Striped-placeholder / real screenshot for the featured browser mockup. */
export interface Screenshot {
  /** Real image URL. When omitted the striped placeholder + label is shown. */
  src?: string;
  alt: string;
  /** Label shown inside the placeholder when no `src` is set. */
  placeholder: string;
}

/** Featured project (section 4). */
export interface FeaturedProject {
  prompt: string;
  titleLines: string[];
  url: string;
  urlLabel: string;
  ciLabel: string;
  body: string;
  /** Metric labels without the leading check glyph, e.g. "214 tests". */
  pills: string[];
  actionLabel: string;
  meta: string;
  screenshot: Screenshot;
}

/** A secondary project card (section 6). */
export interface WorkProject {
  name: string;
  description: string;
  /** Tech + year meta, e.g. "Node · Playwright · 2024". */
  meta: string;
  url: string;
  passing: boolean;
}

/** A writing entry (section 7). */
export interface Post {
  title: string;
  blurb: string;
  /** Human date, e.g. "Feb 2026". */
  date: string;
  /** Reading time, e.g. "6 min". */
  readingTime: string;
  url: string;
}

/** Footer CTA (section 8). */
export interface FooterContent {
  prompt: string;
  titleLines: string[];
  email: string;
}

/** The full, hand-authored configuration + content for the page. */
export interface SiteConfig {
  identity: Identity;
  nav: NavItem[];
  socials: SocialLink[];
  /** Nav status line, e.g. "build: passing". */
  buildStatus: string;
  hero: HeroContent;
  pipeline: PipelineContent;
  /** Marquee keywords (section 3), rendered twice for a seamless loop. */
  marqueeKeywords: string[];
  featured: FeaturedProject;
  work: WorkProject[];
  posts: Post[];
  footer: FooterContent;
}

/**
 * A commit row in the git-log terminal. This is a view model: `relativeTime`
 * is already formatted (seed data hard-codes it; the GitHub mapper computes it
 * from a real timestamp), so the renderer only ever displays strings.
 */
export interface Commit {
  hash: string;
  message: string;
  relativeTime: string;
  url?: string;
}

/** One cell of the GitHub contribution heat grid. */
export interface ContributionCell {
  level: HeatLevel;
  /** Contribution count for the day (used for the hover title / a11y). */
  count: number;
  /** ISO date of the cell, when known. */
  date?: string;
}

/** Everything shown in the GitHub panel (section 5, right). */
export interface GitHubSummary {
  handle: string;
  profileUrl: string;
  contributions: ContributionCell[];
  contributionCount: number;
  repoCount: number;
}

/** The live-capable data shown in the recent-activity section. */
export interface ActivityData {
  commits: Commit[];
  github: GitHubSummary;
}
