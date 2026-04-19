import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  buildTimeLogStubFileBodyV1,
  buildTimeLogStubPerSuffixBodiesV1,
  formatTimeLogStubLineV1,
  parseTimeLogStubFileTextV1,
} from "./timeLogStubLine.js";

const twelljrDir = dirname(fileURLToPath(import.meta.url));

describe("formatTimeLogStubLineV1", () => {
  it("formats a fixed row (golden)", () => {
    expect(
      formatTimeLogStubLineV1({
        id: "00000000-0000-4000-8000-000000000001",
        savedAt: "2026-04-17T12:00:00.000Z",
        gameMode: "kihon",
        elapsedMs: 12_345,
        resultLevelId: "A",
        missCount: 2,
      })
    ).toBe(
      "WEB_V1\t2026-04-17T12:00:00.000Z\tKHJY\t12.345\tA\t2\t00000000-0000-4000-8000-000000000001"
    );
  });

  it("uses empty label when result is null", () => {
    expect(
      formatTimeLogStubLineV1({
        id: "id-2",
        savedAt: "2026-01-01T00:00:00.000Z",
        gameMode: "kanyoku",
        elapsedMs: 0,
        resultLevelId: null,
        missCount: 0,
      })
    ).toBe("WEB_V1\t2026-01-01T00:00:00.000Z\tKTWZ\t0.000\t\t0\tid-2");
  });
});

describe("buildTimeLogStubFileBodyV1", () => {
  it("sorts by savedAt and includes preamble", () => {
    const body = buildTimeLogStubFileBodyV1([
      {
        id: "b",
        savedAt: "2026-04-02T00:00:00.000Z",
        gameMode: "kanji",
        elapsedMs: 1000,
        resultLevelId: null,
        missCount: 1,
      },
      {
        id: "a",
        savedAt: "2026-04-01T00:00:00.000Z",
        gameMode: "kihon",
        elapsedMs: 2000,
        resultLevelId: "B",
        missCount: 0,
      },
    ]);
    expect(body.startsWith("# TWJR_TIMELOG_STUB_V1")).toBe(true);
    const dataLines = body.split("\n").filter((l) => l.startsWith("WEB_V1"));
    expect(dataLines).toHaveLength(2);
    expect(dataLines[0]).toContain("KHJY");
    expect(dataLines[1]).toContain("KNJ");
  });
});

describe("buildTimeLogStubPerSuffixBodiesV1", () => {
  it("splits rows by suffix into four file bodies", () => {
    const bodies = buildTimeLogStubPerSuffixBodiesV1([
      {
        id: "1",
        savedAt: "2026-01-02T00:00:00.000Z",
        gameMode: "kihon",
        elapsedMs: 1,
        resultLevelId: null,
        missCount: 0,
      },
      {
        id: "2",
        savedAt: "2026-01-01T00:00:00.000Z",
        gameMode: "kanji",
        elapsedMs: 2,
        resultLevelId: "X",
        missCount: 3,
      },
    ]);
    expect(bodies.KHJY.split("\n").filter((l) => l.startsWith("WEB_V1"))).toHaveLength(1);
    expect(bodies.KNJ.split("\n").filter((l) => l.startsWith("WEB_V1"))).toHaveLength(1);
    expect(bodies.KTKN.split("\n").filter((l) => l.startsWith("WEB_V1"))).toHaveLength(0);
    expect(bodies.KTWZ).toContain("stub-filename: TimeKTWZ.log");
  });
});

describe("parseTimeLogStubFileTextV1", () => {
  it("parses fixture file", () => {
    const path = join(twelljrDir, "../../fixtures/timelog-stub/sample-combined.txt");
    const text = readFileSync(path, "utf8");
    const { rows, issues } = parseTimeLogStubFileTextV1(text);
    expect(issues).toEqual([]);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.suffix).toBe("KHJY");
    expect(rows[0]?.elapsedSec).toBe(45);
    expect(rows[1]?.suffix).toBe("KNJ");
  });

  it("issues on lines without WEB_V1 marker", () => {
    const { rows, issues } = parseTimeLogStubFileTextV1("1999-01-01 junk line\n");
    expect(rows).toHaveLength(0);
    expect(issues.some((m) => m.includes("non-WEB_V1"))).toBe(true);
  });
});
