import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mulberry32 } from "./rng.js";
import type { WordEntry } from "./types.js";
import type { JouTripleRow } from "./twelljr/jouSample.js";
import { jouTriplesToWordEntries } from "./twelljr/jouSample.js";
import { buildTrialReading, buildTrialSurfaceLine } from "./wordPicker.js";

const jou1PublicPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../apps/web/public/twelljr-jou1.json"
);
const koto1PublicPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../apps/web/public/twelljr-koto1.json"
);

const dict: WordEntry[] = [
  { surface: "あ", reading: "a", typingKana: "あ", mode: "kihon" },
  { surface: "い", reading: "i", typingKana: "い", mode: "kihon" },
];

describe("buildTrialReading", () => {
  it("returns exact trial length", () => {
    const { reading, words } = buildTrialReading(dict, "kihon", 400, mulberry32(1), 4);
    expect(reading.length).toBe(400);
    expect(words.length).toBeGreaterThan(0);
    expect(words.every((w) => w.reading.length > 0)).toBe(true);
  });

  it("shortens surface when the trial cuts mid-word", () => {
    const one: WordEntry[] = [
      {
        surface: "あいさつ",
        reading: "aisatsu",
        typingKana: "あいさつ",
        mode: "kihon",
      },
    ];
    const { reading, words } = buildTrialReading(one, "kihon", 3, mulberry32(1), 8);
    expect(reading).toBe("ais");
    expect(words).toHaveLength(1);
    expect(words[0]!.reading).toBe("ais");
    expect(words[0]!.surface.length).toBeLessThan("あいさつ".length);
    expect(words[0]!.surface).toMatch(/^あ/);
  });
});

describe("buildTrialSurfaceLine", () => {
  it("joins typingKana with spaces and meets kana-unit budget (scaled to emiel stroke quota)", () => {
    const trial = 400;
    const reserve = 8;
    const { words, emielTargetLine } = buildTrialSurfaceLine(
      dict,
      "kihon",
      trial,
      mulberry32(2),
      4,
      reserve
    );
    const units =
      words.reduce((n, w) => n + w.typingKana.length, 0) +
      Math.max(0, words.length - 1);
    const targetKana = Math.ceil(trial * 0.52);
    expect(units).toBeGreaterThanOrEqual(targetKana);
    expect(units).toBeLessThanOrEqual(targetKana + reserve + 12);
    expect(emielTargetLine).toBe(words.map((w) => w.typingKana).join(" "));
    expect(emielTargetLine).toMatch(/ /);
  });

  it("includes kanji-surface words using romaji-derived kana", () => {
    const mixed: WordEntry[] = [
      {
        surface: "哀愁",
        reading: "aishuu",
        typingKana: "あいしゅう",
        mode: "kanji",
      },
    ];
    const { words, emielTargetLine } = buildTrialSurfaceLine(
      mixed,
      "kanji",
      10,
      mulberry32(0),
      4,
      2
    );
    expect(words.length).toBeGreaterThan(0);
    expect(emielTargetLine).toContain("あいしゅう");
  });

  it("on real Jou1 JSON, picked words stay near scaled kana budget (matches ~400 emiel strokes)", () => {
    const rows = JSON.parse(readFileSync(jou1PublicPath, "utf8")) as JouTripleRow[];
    const words = jouTriplesToWordEntries(rows, "kihon");
    const { words: picked, emielTargetLine } = buildTrialSurfaceLine(
      words,
      "kihon",
      400,
      mulberry32(99),
      8,
      8
    );
    const units =
      picked.reduce((n, w) => n + w.typingKana.length, 0) +
      Math.max(0, picked.length - 1);
    const readingSum = picked.reduce((n, w) => n + w.reading.length, 0);
    const targetKana = Math.ceil(400 * 0.52);
    expect(units).toBeGreaterThanOrEqual(targetKana);
    expect(units).toBeLessThan(targetKana + 40);
    expect(picked.length).toBeLessThan(200);
    expect(readingSum).toBeLessThan(1400);
    expect(emielTargetLine.length).toBeLessThan(450);
  });

  it("on real Koto1 JSON, picked line is not reading×3 scale", () => {
    const rows = JSON.parse(readFileSync(koto1PublicPath, "utf8")) as JouTripleRow[];
    const words = jouTriplesToWordEntries(rows, "kanyoku");
    const { words: picked, emielTargetLine } = buildTrialSurfaceLine(
      words,
      "kanyoku",
      400,
      mulberry32(7),
      8,
      8
    );
    const units =
      picked.reduce((n, w) => n + w.typingKana.length, 0) +
      Math.max(0, picked.length - 1);
    const readingSum = picked.reduce((n, w) => n + w.reading.length, 0);
    const targetKana = Math.ceil(400 * 0.52);
    expect(units).toBeGreaterThanOrEqual(targetKana);
    expect(units).toBeLessThan(targetKana + 40);
    expect(readingSum).toBeLessThan(1800);
    expect(picked.length).toBeLessThan(90);
    expect(emielTargetLine.length).toBeLessThan(500);
  });
});
