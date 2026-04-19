import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Regression: committed cleanroom JSON must not embed strings from the small
 * decomp-derived sample fixture (Lane A smoke reference).
 */
describe("cleanroom committed fixture", () => {
  it("does not contain jou1-sample first-row surface or reading", () => {
    const text = readFileSync(
      join(here, "../../test-fixtures/cleanroom-twelljr-jou1.json"),
      "utf8"
    );
    expect(text.toLowerCase()).not.toContain("aisatsu");
    expect(text).not.toContain("あいさつ");
  });
});
