import { el } from "../dom.js";

/** The three macOS-style traffic-light dots used on chrome/terminal bars. */
export function trafficLights(): HTMLElement[] {
  return (["red", "amber", "green"] as const).map((colour) =>
    el("span", { class: `dot dot--${colour}`, attrs: { "aria-hidden": "true" } }),
  );
}
