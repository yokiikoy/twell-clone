import { describe, expect, it } from "vitest";
import { extractTriplesFlexible } from "./extractBasTriples.js";

/**
 * Pipeline smoke: first Jou1 arm as decoded LitStr sequence (no CP932 on disk in test).
 */
describe("extractJou triples (golden head)", () => {
  it("matches first Jou1 dispatch arm from LitStr sequence", () => {
    const lit = [
      "挨拶",
      "aisatsu",
      "1101t01",
      "愛する",
      "aisuru",
      "1101t02",
    ];
    const t = extractTriplesFlexible(lit).slice(0, 5);
    expect(t[0]?.reading).toBe("aisatsu");
    expect(t[0]?.code).toBe("1101t01");
    expect(t[0]?.surface).toBe("挨拶");
  });
});
