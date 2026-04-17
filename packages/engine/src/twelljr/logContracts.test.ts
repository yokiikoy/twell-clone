import { describe, expect, it } from "vitest";
import {
  detailLogBasename,
  poorLogBasename,
  timeLogBasename,
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
});
