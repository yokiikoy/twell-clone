import { describe, expect, it } from "vitest";
import {
  MODULE1_CHART_LABEL_ORDER,
  twellJrBigRunFontFamilyHint,
  twellJrGoalKeyPacing,
  twellJrLabelFromTotalSeconds,
} from "./module1Core.js";

describe("MODULE1_CHART_LABEL_ORDER (UI strip)", () => {
  it("runs ZS … J in ladder order", () => {
    expect(MODULE1_CHART_LABEL_ORDER[0]).toBe("ZS");
    expect(MODULE1_CHART_LABEL_ORDER[MODULE1_CHART_LABEL_ORDER.length - 1]).toBe("J");
    expect(MODULE1_CHART_LABEL_ORDER.length).toBe(44);
  });
});

describe("twellJrLabelFromTotalSeconds (Module1 Proc_1_0)", () => {
  it("maps probe 5s to ZS", () => {
    expect(twellJrLabelFromTotalSeconds(5)).toBe("ZS");
  });
  it("maps probe 75s to SJ", () => {
    expect(twellJrLabelFromTotalSeconds(75)).toBe("SJ");
  });
  it("maps dash band at and above 206s", () => {
    expect(twellJrLabelFromTotalSeconds(206)).toBe("-");
    expect(twellJrLabelFromTotalSeconds(300)).toBe("-");
  });
  it("maps 205.9s to J", () => {
    expect(twellJrLabelFromTotalSeconds(205.9)).toBe("J");
  });
  it("maps 35.9s to XA (machine band)", () => {
    expect(twellJrLabelFromTotalSeconds(35.9)).toBe("XA");
  });
});

describe("twellJrBigRunFontFamilyHint (76s branch)", () => {
  it("uses MS Gothic below 76s", () => {
    expect(twellJrBigRunFontFamilyHint(75.9)).toBe("ms-gothic");
  });
  it("uses MS P Gothic at 76s and above", () => {
    expect(twellJrBigRunFontFamilyHint(76)).toBe("ms-pgothic");
    expect(twellJrBigRunFontFamilyHint(210)).toBe("ms-pgothic");
  });
});

describe("twellJrGoalKeyPacing (Module1 Proc_1_1)", () => {
  it("maps A and a", () => {
    expect(twellJrGoalKeyPacing("A")).toEqual({ field100: 25, field104: 0x31 });
    expect(twellJrGoalKeyPacing("a")).toEqual({ field100: 25, field104: 0x63 });
  });
  it("maps digit 0", () => {
    expect(twellJrGoalKeyPacing("0")).toEqual({ field100: 9, field104: 0x63 });
  });
  it("returns null for unknown key", () => {
    expect(twellJrGoalKeyPacing("!")).toBeNull();
    expect(twellJrGoalKeyPacing("AA")).toBeNull();
  });
});
