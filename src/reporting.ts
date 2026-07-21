// Minimal, dependency-free client-side error reporting.
//
// The app deliberately swallows failures to keep the page intact — a live
// GitHub outage must never blank the panels (see data-source.ts / app.ts). But
// swallowing *silently* means a persistent failure (say the live GitHub calls
// quietly start 404-ing) would go unnoticed. This makes those failures
// observable without a third-party SDK or a CSP hole: it logs to the console
// and, when Vercel Web Analytics is present, emits a same-origin custom event
// so the failure surfaces in the dashboard.

/** Reports a client-side error under a short context label. */
export type ErrorReporter = (context: string, error: unknown) => void;

/** The Vercel Web Analytics queue function (present only in production). */
type VercelAnalytics = (event: "event", payload: { name: string; data?: Record<string, unknown> }) => void;

/** The subset of `window` the reporter touches — injected so it's testable. */
export interface ReportingWindow {
  console?: { error?: (...args: unknown[]) => void };
  va?: VercelAnalytics;
  addEventListener?: (type: string, listener: (event: unknown) => void) => void;
}

/** Normalise any thrown value into a human-readable message string. */
export function messageOf(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  try {
    return JSON.stringify(error) ?? String(error);
  } catch {
    return String(error);
  }
}

/**
 * Build a reporter bound to `win`. It logs the error to the console and, when
 * Vercel Web Analytics is available, sends a `client_error` custom event
 * (same-origin, no new dependency, no CSP change). Best-effort: analytics
 * failures never propagate.
 */
export function createErrorReporter(win: ReportingWindow): ErrorReporter {
  return (context, error) => {
    win.console?.error?.(`[testingcharlie] ${context}:`, error);
    try {
      win.va?.("event", { name: "client_error", data: { context, message: messageOf(error) } });
    } catch {
      // A reporting failure must never become a second error.
    }
  };
}

/**
 * Route uncaught errors and unhandled promise rejections through `report`, so
 * failures outside the hydrate path are visible too. Safe to call once at
 * startup; a no-op where listeners can't be added.
 */
export function installGlobalHandlers(win: ReportingWindow, report: ErrorReporter): void {
  win.addEventListener?.("error", (event) => {
    const e = event as { error?: unknown; message?: unknown };
    report("window.error", e.error ?? e.message ?? event);
  });
  win.addEventListener?.("unhandledrejection", (event) => {
    const e = event as { reason?: unknown };
    report("unhandledrejection", e.reason ?? event);
  });
}
