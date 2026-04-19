import { describe, expect, it } from "vitest";
import { dedupeCleanroomCandidates } from "./dedup.js";

describe("dedupeCleanroomCandidates", () => {
  it("drops duplicate normalized within the same mode", () => {
    const rows = dedupeCleanroomCandidates([
      { surface: "話す", normalized: "話す", reading: "hanasu", mode: "kihon" },
      { surface: "はなす", normalized: "話す", reading: "hanasu", mode: "kihon" },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.surface).toBe("話す");
  });

  it("keeps same normalized in different modes", () => {
    const rows = dedupeCleanroomCandidates([
      { surface: "話す", normalized: "話す", reading: "hanasu", mode: "kihon" },
      { surface: "話す", normalized: "話す", reading: "hanasu", mode: "kanji" },
    ]);
    expect(rows).toHaveLength(2);
  });

  it("drops second row with same surface in the same mode (heterograph collapse)", () => {
    const rows = dedupeCleanroomCandidates([
      { surface: "日本", normalized: "日本", reading: "nihon", mode: "kanji" },
      { surface: "日本", normalized: "日本", reading: "nippon", mode: "kanji" },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.reading).toBe("nihon");
  });
});
