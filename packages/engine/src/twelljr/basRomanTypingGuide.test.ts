import { describe, expect, it } from "vitest";
import { basRomanTypingGuide, longestBasReadingPrefixForTypedKana } from "./basRomanTypingGuide.js";
import type { WordEntry } from "../types.js";

const mode = "kihon" as const;

function w(surface: string, reading: string, typingKana: string): WordEntry {
  return { surface, reading, typingKana, mode };
}

describe("longestBasReadingPrefixForTypedKana", () => {
  it("finds oto for おと within otonashii", () => {
    expect(longestBasReadingPrefixForTypedKana("otonashii", "おと")).toBe("oto");
  });

  it("finds full reading when kana matches whole word", () => {
    expect(longestBasReadingPrefixForTypedKana("otonashii", "おとなしい")).toBe("otonashii");
  });
});

describe("basRomanTypingGuide", () => {
  it("shows all pending when nothing typed", () => {
    const segments = [w("挨拶", "aisatsu", "あいさつ"), w("言葉", "kotoba", "ことば")];
    const line = "あいさつ ことば";
    expect(basRomanTypingGuide(segments, line, "")).toEqual({
      finishedRoman: "",
      pendingRoman: "aisatsu kotoba",
    });
  });

  it("splits after partial first word (kana prefix)", () => {
    const segments = [w("大人しい", "otonashii", "おとなしい")];
    const line = "おとなしい";
    expect(basRomanTypingGuide(segments, line, "おと")).toEqual({
      finishedRoman: "oto",
      pendingRoman: "nashii",
    });
  });

  it("includes spaces between words in guide", () => {
    const segments = [w("挨拶", "aisatsu", "あいさつ"), w("言葉", "kotoba", "ことば")];
    const line = "あいさつ ことば";
    expect(basRomanTypingGuide(segments, line, "あいさつ")).toEqual({
      finishedRoman: "aisatsu",
      pendingRoman: " kotoba",
    });
  });

  it("finishes with empty pending when line complete", () => {
    const segments = [w("あ", "a", "あ")];
    const line = "あ";
    expect(basRomanTypingGuide(segments, line, "あ")).toEqual({
      finishedRoman: "a",
      pendingRoman: "",
    });
  });
});
