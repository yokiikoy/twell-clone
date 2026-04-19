import { describe, expect, it } from "vitest";
import { parseNativeDateTimeUtcMs, timeBinaryV0SortMs } from "./nativeTimelineSortV0.js";

describe("nativeTimelineSortV0", () => {
  it("parses yyyy/m/d + H:MM:SS as UTC ms", () => {
    const ms = parseNativeDateTimeUtcMs("2026/4/17", "14:05:30");
    expect(ms).toBe(Date.UTC(2026, 3, 17, 14, 5, 30));
  });
  it("returns null on bad shapes", () => {
    expect(parseNativeDateTimeUtcMs("04-17-2026", "14:05:30")).toBeNull();
    expect(parseNativeDateTimeUtcMs("2026/4/17", "2:5pm")).toBeNull();
  });
  it("timeBinaryV0SortMs falls back to 0", () => {
    expect(timeBinaryV0SortMs("???", "12:00:00")).toBe(0);
  });
});
