import { describe, expect, it } from "vitest";
import {
  extractTriplesFlexible,
  toEnvelope,
  EXTRACT_BAS_TRIPLES_SCHEMA_VERSION,
} from "./extractBasTriples.js";

describe("extractTriplesFlexible (golden)", () => {
  it("Jou1-style strict triples: first three LitStr values", () => {
    const lit = ["挨拶", "aisatsu", "1101t01", "愛する", "aisuru", "1101t02"];
    expect(extractTriplesFlexible(lit)).toEqual([
      { surface: "挨拶", reading: "aisatsu", code: "1101t01" },
      { surface: "愛する", reading: "aisuru", code: "1101t02" },
    ]);
  });

  it("Kan-style multiple consecutive romaji before code (一朝一夕)", () => {
    const lit = [
      "一朝一夕",
      "ichijisetsuya",
      "isshousitchou",
      "1102k01",
      "単語",
      "tango",
      "1102k02",
    ];
    expect(extractTriplesFlexible(lit)).toEqual([
      {
        surface: "一朝一夕",
        reading: "ichijisetsuya",
        code: "1102k01",
      },
      { surface: "単語", reading: "tango", code: "1102k02" },
    ]);
  });

  it("skips noise until a valid Japanese-led triple", () => {
    const lit = ["foo", "bar", "挨拶", "aisatsu", "1101t01"];
    expect(extractTriplesFlexible(lit)).toEqual([
      { surface: "挨拶", reading: "aisatsu", code: "1101t01" },
    ]);
  });
});

describe("toEnvelope", () => {
  it("adds schemaVersion, source, count, and index on each triple", () => {
    const triples = [{ surface: "a", reading: "b", code: "c" }];
    const env = toEnvelope("/path/Jou1.bas", triples);
    expect(env.schemaVersion).toBe(EXTRACT_BAS_TRIPLES_SCHEMA_VERSION);
    expect(env.source).toBe("/path/Jou1.bas");
    expect(env.count).toBe(1);
    expect(env.triples).toEqual([
      { surface: "a", reading: "b", code: "c", index: 0 },
    ]);
  });
});
