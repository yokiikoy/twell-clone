import { describe, expect, it } from "vitest";
import { mozcMinStrokesForHiraganaLine } from "./emielStrokeBudget.js";

describe("mozcMinStrokesForHiraganaLine", () => {
  it("counts shortest-path strokes for plain kana (QWERTY JIS / emiel)", () => {
    expect(mozcMinStrokesForHiraganaLine("あ")).toBe(1);
    expect(mozcMinStrokesForHiraganaLine("あ い")).toBe(3);
  });

  it("includes multi-stroke morae", () => {
    expect(mozcMinStrokesForHiraganaLine("あいさつ")).toBe(6);
  });
});
