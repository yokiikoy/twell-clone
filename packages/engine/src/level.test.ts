import { describe, expect, it } from "vitest";
import { levelFromTotalSeconds } from "./level.js";

describe("levelFromTotalSeconds", () => {
  it("returns null for very slow trials", () => {
    expect(levelFromTotalSeconds(206)).toBeNull();
    expect(levelFromTotalSeconds(300)).toBeNull();
  });

  it("maps boundary near amateur slow end", () => {
    expect(levelFromTotalSeconds(205.9)).toBe("J");
  });

  it("maps boundary near amateur fast end", () => {
    expect(levelFromTotalSeconds(76)).toBe("A");
  });

  it("maps professional band", () => {
    expect(levelFromTotalSeconds(75.9)).toBe("SJ");
    expect(levelFromTotalSeconds(56)).toBe("SA");
  });

  it("maps genius band", () => {
    expect(levelFromTotalSeconds(55.9)).toBe("SS");
    expect(levelFromTotalSeconds(36)).toBe("XB");
  });

  it("maps machine band", () => {
    expect(levelFromTotalSeconds(35.9)).toBe("XA");
    expect(levelFromTotalSeconds(0.1)).toBe("ZG");
  });
});
