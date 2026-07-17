import { describe, expect, it } from "vitest";
import { relativeTime } from "../../src/time.js";

const base = new Date("2026-07-17T12:00:00Z");

function ago(ms: number): Date {
  return new Date(base.getTime() - ms);
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("relativeTime", () => {
  it("collapses sub-minute and future gaps to 'just now'", () => {
    expect(relativeTime(base, base)).toBe("just now");
    expect(relativeTime(ago(30 * SECOND), base)).toBe("just now");
    expect(relativeTime(new Date(base.getTime() + HOUR), base)).toBe("just now");
  });

  it("formats minutes and hours", () => {
    expect(relativeTime(ago(2 * MINUTE), base)).toBe("2m ago");
    expect(relativeTime(ago(59 * MINUTE), base)).toBe("59m ago");
    expect(relativeTime(ago(2 * HOUR), base)).toBe("2h ago");
    expect(relativeTime(ago(23 * HOUR), base)).toBe("23h ago");
  });

  it("uses 'yesterday' for exactly one day and days below a week", () => {
    expect(relativeTime(ago(DAY), base)).toBe("yesterday");
    expect(relativeTime(ago(3 * DAY), base)).toBe("3d ago");
    expect(relativeTime(ago(6 * DAY), base)).toBe("6d ago");
  });

  it("formats weeks, months and years", () => {
    expect(relativeTime(ago(7 * DAY), base)).toBe("1w ago");
    expect(relativeTime(ago(29 * DAY), base)).toBe("4w ago");
    expect(relativeTime(ago(60 * DAY), base)).toBe("2mo ago");
    expect(relativeTime(ago(400 * DAY), base)).toBe("1y ago");
  });
});
