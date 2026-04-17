import { describe, expect, it } from "vitest";
import { romajiToTypingKana } from "./romajiTypingKana.js";

describe("romajiToTypingKana", () => {
  it("converts BAS-style romaji to hiragana", () => {
    expect(romajiToTypingKana("aisatsu")).toBe("あいさつ");
    expect(romajiToTypingKana("ICHIJISETSUYA")).toBe("いちじせつや");
  });

  it("maps BAS nn spellings for ん to single mora (not んん)", () => {
    expect(romajiToTypingKana("hunnbaru")).toBe("ふんばる");
    expect(romajiToTypingKana("kennka")).toBe("けんか");
    expect(romajiToTypingKana("konnnichiha")).toBe("こんにちは");
    expect(romajiToTypingKana("ginnnann")).toBe("ぎんなん");
    expect(romajiToTypingKana("unnnunn")).toBe("うんぬん");
  });

  it("maps otonashii to おとなしい (BAS trailing ii = shi + i)", () => {
    expect(romajiToTypingKana("otonashii")).toBe("おとなしい");
  });
});
