// Build-time templating for the static HTML shell. index.html carries
// `__TOKEN__` placeholders that the build fills from the typed config in src/
// (the SEO title/description) — so that copy lives in exactly one place and
// can never drift between the page and the app.
//
// Pure + unit-tested; scripts/build-site.mjs wires it to the real config.

const HTML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };

/** Escape a value for HTML text or a double-quoted attribute. */
export function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (ch) => HTML_ESCAPES[ch]);
}

/**
 * Replace every `__TOKEN__` in `html` from `values` (keyed by TOKEN name), then
 * fail loud if any placeholder is left unresolved — better a broken build than a
 * literal `__TOKEN__` shipped to users. Callers pre-escape values for context.
 */
export function applyTemplate(html, values) {
  const filled = html.replace(/__([A-Z0-9_]+)__/g, (match, name) =>
    name in values ? values[name] : match,
  );
  const leftover = filled.match(/__[A-Z0-9_]+__/);
  if (leftover) {
    throw new Error(`Unresolved HTML template placeholder: ${leftover[0]}`);
  }
  return filled;
}
