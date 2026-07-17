import { el, linkTo, multiline } from "../dom.js";
import type { SiteConfig } from "../types.js";

/** Footer CTA band (section 8): prompt, big headline, email + socials. */
export function renderFooter(config: SiteConfig): HTMLElement {
  const { footer, socials } = config;

  const email = el("a", {
    class: "site-footer__email",
    text: footer.email,
    attrs: { href: `mailto:${footer.email}` },
  });

  const socialLinks = el("div", {
    class: "site-footer__socials",
    children: socials.map((social) => linkTo(social.href, "social", [social.label])),
  });

  const inner = el("div", {
    class: "wrap site-footer__inner",
    children: [
      el("div", { class: "site-footer__prompt", text: footer.prompt }),
      el("h2", { class: "site-footer__title", children: multiline(footer.titleLines) }),
      el("div", { class: "site-footer__row", children: [email, socialLinks] }),
    ],
  });

  return el("footer", { class: "site-footer", attrs: { id: "contact" }, children: [inner] });
}
