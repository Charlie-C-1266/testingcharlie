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
    siteUrl: "https://www.testingcharlie.co.uk",
    image: {
      path: "/og.png",
      alt: "testingcharlie — Charlie, senior test engineer. Automation, CI/CD and DevOps.",
      width: 1200,
      height: 630,
      type: "image/png",
    },
    locale: "en_GB",
    person: { name: "Charlie", jobTitle: "Senior Test Engineer" },
  },
  // Small fixed strings that head or label the sections. Everything the page
  // says lives in this file — edit here to reword a prompt, panel title or
  // button. (Decorative glyphs like the ✓ separators and the blinking cursor
  // stay in the render layer; see UiLabels in types.ts.)
  ui: {
    contactCta: "get in touch",
    themeToggle: { toDark: "☾ dark", toLight: "☀ light" },
    prompts: {
      recentActivity: "$ ~/recent-activity",
      about: "$ ~/about",
      moreWork: "$ ~/more-work",
      writing: "$ ~/writing",
    },
    pipeline: { title: "ci/cd pipeline", status: "passing" },
    github: { title: "github", profileLink: "view profile →" },
    terminal: { command: "git log --oneline", branch: "main ✓" },
    passing: "passing",
    writingEmpty: "coming soon",
  },
  nav: [
    { label: "work", href: "#work" },
    { label: "writing", href: "#writing" },
    { label: "about", href: "#about" },
  ],
  socials: [
    { label: "GitHub", href: "https://github.com/Charlie-C-1266" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/charlie2706/" },
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
  // About / bio band — the nav "about" link scrolls here. This is PLACEHOLDER
  // copy: Charlie to replace the TODO lines with real words before we open the
  // PR. Keep it short — a couple of intro sentences and a few labelled
  // highlights. The section, styles and tests are already wired; only the
  // strings below need editing.
  about: {
    heading: "About",
    lead: [
      // TODO(charlie): 1–2 sentences — who you are and the testing/automation
      // work you do best (e.g. the kinds of teams, problems and outcomes).
      "TODO: a couple of sentences introducing yourself and the testing and " +
        "automation work you do best.",
      // TODO(charlie): optional second paragraph — how you work, or what you
      // care about. Delete this line if one paragraph is enough.
      "TODO: an optional second line on how you work or what you care about — " +
        "delete this paragraph if one is enough.",
    ],
    highlights: [
      // TODO(charlie): replace each detail with real specifics. Add or remove
      // rows freely — the list renders whatever is here.
      { term: "Focus", detail: "TODO: your core specialisms (automation, CI/CD, DevOps…)." },
      { term: "Experience", detail: "TODO: a notable role, domain or measurable win." },
      { term: "Toolbox", detail: "TODO: the tools you reach for most." },
      { term: "Open to", detail: "TODO: what you're currently open to." },
    ],
  },
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
    // Baked from the live site by `npm run gen:screenshot` into
    // static/caniaffordthat.png (served same-origin at /caniaffordthat.png).
    // The script derives both the page to capture (`url` above) and this output
    // path from here, so this stays the single source. `placeholder` is the
    // fallback label shown only if `src` is ever cleared.
    screenshot: {
      src: "/caniaffordthat.png",
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
