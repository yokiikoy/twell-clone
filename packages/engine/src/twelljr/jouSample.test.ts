import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { JouTripleRow } from "./jouSample.js";
import { jouTriplesToWordEntries } from "./jouSample.js";
import { buildTrialReading } from "../wordPicker.js";
import { mulberry32 } from "../rng.js";

const here = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(here, "../../test-fixtures/jou1-sample.json");

describe("jouTriplesToWordEntries", () => {
  it("uses surface as typingKana when surface is plain hiragana", () => {
    const rows: JouTripleRow[] = [
      {
        surface: "おとなしい",
        reading: "otonashii",
        code: "x",
        index: 1,
      },
    ];
    const [w] = jouTriplesToWordEntries(rows, "kihon");
    expect(w.typingKana).toBe("おとなしい");
    expect(w.reading).toBe("otonashii");
  });
});

describe("jou1 sample fixture", () => {
  it("feeds buildTrialReading for kihon mode", () => {
    const raw = JSON.parse(readFileSync(fixturePath, "utf8")) as JouTripleRow[];
    const words = jouTriplesToWordEntries(raw, "kihon");
    const { reading } = buildTrialReading(words, "kihon", 24, mulberry32(1), 2);
    expect(reading.length).toBe(24);
    expect(reading).toMatch(/^[a-z]+$/);
  });
});
