import { describe, expect, it, vi } from "vitest";
import {
  createErrorReporter,
  installGlobalHandlers,
  messageOf,
  type ReportingWindow,
} from "../../src/reporting.js";

describe("messageOf", () => {
  it("uses the message of an Error", () => {
    expect(messageOf(new Error("boom"))).toBe("boom");
  });

  it("passes a string through unchanged", () => {
    expect(messageOf("offline")).toBe("offline");
  });

  it("JSON-stringifies plain objects", () => {
    expect(messageOf({ status: 500 })).toBe('{"status":500}');
  });

  it("falls back to String() when a value can't be stringified", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(messageOf(circular)).toBe("[object Object]");
  });

  it("falls back to String() when JSON.stringify yields undefined", () => {
    // JSON.stringify(undefined) === undefined → the `?? String(error)` branch.
    expect(messageOf(undefined)).toBe("undefined");
  });
});

describe("createErrorReporter", () => {
  it("logs to the console with a tagged context", () => {
    const error = new Error("nope");
    const consoleError = vi.fn();
    const report = createErrorReporter({ console: { error: consoleError } });

    report("hydrate", error);

    expect(consoleError).toHaveBeenCalledWith("[testingcharlie] hydrate:", error);
  });

  it("emits a Vercel Analytics custom event with the context and message", () => {
    const va = vi.fn();
    const report = createErrorReporter({ va });

    report("hydrate", new Error("rate limited"));

    expect(va).toHaveBeenCalledWith("event", {
      name: "client_error",
      data: { context: "hydrate", message: "rate limited" },
    });
  });

  it("no-ops safely when neither console nor analytics is present", () => {
    const report = createErrorReporter({});
    expect(() => report("hydrate", new Error("x"))).not.toThrow();
  });

  it("tolerates a console without an error method", () => {
    const report = createErrorReporter({ console: {} });
    expect(() => report("hydrate", new Error("x"))).not.toThrow();
  });

  it("swallows analytics failures so reporting never throws twice", () => {
    const va = vi.fn(() => {
      throw new Error("analytics down");
    });
    const report = createErrorReporter({ va });
    expect(() => report("hydrate", new Error("x"))).not.toThrow();
  });
});

/** A fake window that records listeners so we can fire them. */
function fakeWindow() {
  const listeners = new Map<string, (event: unknown) => void>();
  const win: ReportingWindow = {
    addEventListener: (type, listener) => listeners.set(type, listener),
  };
  return { win, listeners };
}

describe("installGlobalHandlers", () => {
  it("registers error and unhandledrejection listeners", () => {
    const { win, listeners } = fakeWindow();
    installGlobalHandlers(win, vi.fn());
    expect([...listeners.keys()]).toEqual(["error", "unhandledrejection"]);
  });

  it("reports the error of an ErrorEvent", () => {
    const { win, listeners } = fakeWindow();
    const report = vi.fn();
    installGlobalHandlers(win, report);

    const error = new Error("uncaught");
    listeners.get("error")?.({ error, message: "uncaught" });
    expect(report).toHaveBeenCalledWith("window.error", error);
  });

  it("falls back to the message when an ErrorEvent has no error object", () => {
    const { win, listeners } = fakeWindow();
    const report = vi.fn();
    installGlobalHandlers(win, report);

    listeners.get("error")?.({ message: "script error" });
    expect(report).toHaveBeenCalledWith("window.error", "script error");
  });

  it("falls back to the raw event when an ErrorEvent has neither error nor message", () => {
    const { win, listeners } = fakeWindow();
    const report = vi.fn();
    installGlobalHandlers(win, report);

    const event = {};
    listeners.get("error")?.(event);
    expect(report).toHaveBeenCalledWith("window.error", event);
  });

  it("reports the reason of a rejection", () => {
    const { win, listeners } = fakeWindow();
    const report = vi.fn();
    installGlobalHandlers(win, report);

    listeners.get("unhandledrejection")?.({ reason: "timeout" });
    expect(report).toHaveBeenCalledWith("unhandledrejection", "timeout");
  });

  it("falls back to the raw event when a rejection has no reason", () => {
    const { win, listeners } = fakeWindow();
    const report = vi.fn();
    installGlobalHandlers(win, report);

    const event = {};
    listeners.get("unhandledrejection")?.(event);
    expect(report).toHaveBeenCalledWith("unhandledrejection", event);
  });

  it("no-ops when the environment can't add listeners", () => {
    expect(() => installGlobalHandlers({}, vi.fn())).not.toThrow();
  });
});
