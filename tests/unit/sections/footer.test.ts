import { describe, expect, it } from "vitest";
import { renderFooter } from "../../../src/sections/footer.js";
import { siteConfig } from "../../../src/config.js";

describe("renderFooter", () => {
  it("is the #contact footer with a mailto email and socials", () => {
    const footer = renderFooter(siteConfig);
    expect(footer.tagName).toBe("FOOTER");
    expect(footer.getAttribute("id")).toBe("contact");

    const email = footer.querySelector(".site-footer__email");
    expect(email?.getAttribute("href")).toBe(`mailto:${siteConfig.footer.email}`);

    expect(footer.querySelectorAll(".social")).toHaveLength(siteConfig.socials.length);
    expect(footer.querySelector(".site-footer__prompt")?.textContent).toBe(siteConfig.footer.prompt);
  });

  it("renders the headline across two lines", () => {
    const footer = renderFooter(siteConfig);
    expect(footer.querySelectorAll(".site-footer__title br")).toHaveLength(siteConfig.footer.titleLines.length - 1);
  });
});
