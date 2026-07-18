import type { SiteConfig } from "./types.js";
import { generatedPosts } from "./posts.generated.js";

// The single source of hand-authored content and settings for the homepage.
// Edit values here to change what the page says — the render layer never
// hard-codes copy. Placeholders from the design handoff are marked below and
// should be swapped for Charlie's real content over time.
export const siteConfig: SiteConfig = {
  identity: {
    brand: "testingcharlie",
    brandTld: ".co.uk",
    email: "hello@testingcharlie.co.uk",
    // Real GitHub account, used for the live API calls.
    githubUsername: "Charlie-C-1266",
    // Display handle shown in the GitHub panel (branding, not the API login).
    githubHandle: "@testingcharlie",
    githubUrl: "https://github.com/Charlie-C-1266",
    shellUser: "charlie",
    shellHost: "testing",
  },
  seo: {
    title: "testingcharlie — Charlie · Senior Test Engineer",
    // description omitted → the build reuses hero.lead below, so the "brief"
    // sentence is authored in exactly one place.
  },
  nav: [
    { label: "work", href: "#work" },
    { label: "writing", href: "#writing" },
    { label: "about", href: "#about" },
  ],
  socials: [
    { label: "GitHub", href: "https://github.com/Charlie-C-1266" },
    { label: "LinkedIn", href: "https://www.linkedin.com/" }, // TODO: real profile.
  ],
  buildStatus: "build: passing",
  hero: {
    kicker: "Charlie — Senior Test Engineer · Automation & DevOps",
    titleLines: ["I break things", "so users don't"],
    lead:
      "Bristol-based senior test engineer building the automation, pipelines " +
      "and frameworks that let teams ship fast — without shipping bugs.",
    chips: [
      { label: "GitHub ↗", href: "https://github.com/Charlie-C-1266" },
      { label: "Portfolio ↗", href: "https://charlie-c-1266.github.io/my-portfolio/" },
      { label: "hello@testingcharlie.co.uk", href: "mailto:hello@testingcharlie.co.uk" },
    ],
  },
  pipeline: {
    stages: ["build", "lint", "test", "deploy"],
    stats: [
      { value: "214", label: "tests" },
      { value: "96%", label: "coverage" },
      { value: "0.2%", label: "flake rate", emphasis: true },
    ],
  },
  marqueeKeywords: [
    "playwright",
    "pytest",
    "CI/CD",
    "flaky-test triage",
    "contract testing",
    "load testing",
    "observability",
    "shift-left",
  ],
  featured: {
    prompt: "$ ~/featured",
    titleLines: ["caniaffordthat", ".co.uk"],
    url: "https://www.caniaffordthat.co.uk",
    urlLabel: "caniaffordthat.co.uk",
    ciLabel: "CI passing",
    body:
      "A no-nonsense budgeting tool that answers one question: can I afford " +
      "this, right now? Built for speed, honesty and zero faff.",
    pills: ["214 tests", "96% coverage", "0 flakes"],
    actionLabel: "View project →",
    meta: "React · TypeScript · 2025",
    // No `src` yet → the striped placeholder is shown. Add a real screenshot URL.
    screenshot: {
      alt: "Screenshot of the caniaffordthat.co.uk budgeting app",
      placeholder: "screenshot — caniaffordthat.co.uk",
    },
  },
  work: [
    {
      name: "PiLedger",
      description:
        "A self-hosted personal-finance dashboard: multi-account tracking, " +
        "zero-based envelope budgeting and compound-interest savings projections.",
      meta: "FastAPI · React · 2026",
      url: "https://github.com/Charlie-C-1266/PiLedger",
      passing: true,
    },
    {
      name: "PrimAITE",
      description:
        "A YAML-configurable simulation environment for training and evaluating " +
        "reinforcement-learning agents in a primary-level cyber-defence role.",
      meta: "Python · Gymnasium · 2025",
      url: "https://github.com/Charlie-C-1266/PrimAITE",
      passing: true,
    },
  ],
  // Generated from content/blog/*.md at build time (see scripts/blog.mjs).
  // Empty until a post exists — the writing section then shows "coming soon".
  posts: generatedPosts,
  footer: {
    prompt: "charlie@testing:~$ ./say-hello.sh",
    titleLines: ["Let's ship something", "that doesn't break."],
    email: "hello@testingcharlie.co.uk",
  },
};
