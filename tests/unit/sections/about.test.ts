import { describe, expect, it } from "vitest";
import { renderAbout, renderAboutHighlight } from "../../../src/sections/about.js";
import { siteConfig } from "../../../src/config.js";
import type { AboutContent } from "../../../src/types.js";

const sample: AboutContent = {
  heading: "About",
  lead: ["First paragraph.", "Second paragraph."],
  highlights: [
    { term: "Focus", detail: "Test automation" },
    { term: "Open to", detail: "New challenges" },
  ],
};

describe("renderAboutHighlight", () => {
  it("returns a dt/dd pair carrying the term and detail", () => {
    const [dt, dd] = renderAboutHighlight({ term: "Focus", detail: "Automation" });
    expect(dt?.tagName).toBe("DT");
    expect(dt?.textContent).toBe("Focus");
    expect(dd?.tagName).toBe("DD");
    expect(dd?.textContent).toBe("Automation");
  });
});

describe("renderAbout", () => {
  it("is the #about section, labelled for screen readers", () => {
    const section = renderAbout(sample, "$ ~/about");
    expect(section.tagName).toBe("SECTION");
    expect(section.getAttribute("id")).toBe("about");
    expect(section.getAttribute("aria-label")).toBe("About");
  });

  it("heads the band with the mono prompt and the heading", () => {
    const section = renderAbout(sample, "$ ~/about");
    expect(section.querySelector(".prompt")?.textContent).toBe("$ ~/about");
    expect(section.querySelector(".about__title")?.textContent).toBe("About");
  });

  it("renders one <p> per lead paragraph", () => {
    const section = renderAbout(sample, "$ ~/about");
    const leads = section.querySelectorAll(".about__lead");
    expect(leads).toHaveLength(2);
    expect(leads[0]?.textContent).toBe("First paragraph.");
  });

  it("renders a dt/dd pair per highlight, in order", () => {
    const section = renderAbout(sample, "$ ~/about");
    expect(section.querySelectorAll(".about__highlights dt")).toHaveLength(2);
    expect(section.querySelectorAll(".about__highlights dd")).toHaveLength(2);
    expect(section.querySelector(".about__term")?.textContent).toBe("Focus");
  });

  it("renders whatever the real config holds", () => {
    const section = renderAbout(siteConfig.about, siteConfig.ui.prompts.about);
    expect(section.querySelectorAll(".about__lead")).toHaveLength(siteConfig.about.lead.length);
    expect(section.querySelectorAll(".about__highlights dd")).toHaveLength(siteConfig.about.highlights.length);
  });
});
