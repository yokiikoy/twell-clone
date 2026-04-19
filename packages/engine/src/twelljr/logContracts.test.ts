import { describe, expect, it } from "vitest";
import {
  detailLogBasename,
  inferTimeLogSuffixFromFilename,
  poorLogBasename,
  timeLogBasename,
  timeLogSuffixForGameMode,
  twlSlotBasename,
} from "./logContracts.js";

describe("logContracts", () => {
  it("builds canonical time/detail names", () => {
    expect(timeLogBasename("KHJY")).toBe("TimeKHJY.log");
    expect(detailLogBasename("KTWZ")).toBe("DtldKTWZ.log");
    expect(poorLogBasename("KNJ")).toBe("PoorKNJ.log");
  });
  it("twl slot stems", () => {
    expect(twlSlotBasename(0)).toBe("0.twl");
    expect(twlSlotBasename(3)).toBe("3.twl");
  });
  it("maps GameMode to Time*.log suffix", () => {
    expect(timeLogSuffixForGameMode("kihon")).toBe("KHJY");
    expect(timeLogSuffixForGameMode("katakana")).toBe("KTKN");
    expect(timeLogSuffixForGameMode("kanji")).toBe("KNJ");
    expect(timeLogSuffixForGameMode("kanyoku")).toBe("KTWZ");
  });
  it("infers Time*.log suffix from basename", () => {
    expect(inferTimeLogSuffixFromFilename("TimeKHJY.log")).toBe("KHJY");
    expect(inferTimeLogSuffixFromFilename("C:\\data\\TimeKTKN.log")).toBe("KTKN");
    expect(inferTimeLogSuffixFromFilename("TimeKNJ.LOG")).toBe("KNJ");
    expect(inferTimeLogSuffixFromFilename("Past.log")).toBeNull();
  });
});
