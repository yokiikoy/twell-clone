import { describe, expect, it } from "vitest";
import { buildTrialReading } from "../wordPicker.js";
import { jouTriplesToWordEntries } from "../twelljr/jouSample.js";
import { mulberry32 } from "../rng.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mozcMinStrokesForTriple } from "./joinStrokes.js";

const here = dirname(fileURLToPath(import.meta.url));

describe("mozcMinStrokesForTriple", () => {
  it("returns a positive stroke budget for kana fixture rows", () => {
    expect(mozcMinStrokesForTriple("るーぷえー", "ru-pue-", "kihon")).toBeGreaterThan(0);
  });
});

describe("cleanroom fixture stroke budget smoke", () => {
  it("buildTrialReading reaches target strokes with cleanroom kihon deck", () => {
    const raw = JSON.parse(
      readFileSync(join(here, "../../test-fixtures/cleanroom-twelljr-jou1.json"), "utf8")
    ) as { surface: string; reading: string; code: string; index: number }[];
    const dict = jouTriplesToWordEntries(raw, "kihon");
    const { reading } = buildTrialReading(dict, "kihon", 120, mulberry32(7), 4);
    expect(reading.length).toBeGreaterThan(0);
  });
});
