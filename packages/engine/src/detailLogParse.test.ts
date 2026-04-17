import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseDetailLogText } from "./detailLogParse.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("parseDetailLogText", () => {
  it("extracts words from minimal fixture", () => {
    const text = readFileSync(
      join(__dirname, "../test-fixtures/minimal-detail.txt"),
      "utf8"
    );
    const out = parseDetailLogText(text);
    const bySurface = Object.fromEntries(out.words.map((w) => [w.surface, w.reading]));
    expect(bySurface["雨"]).toBe("ame");
    expect(bySurface["からくり"]).toBe("karakuri");
  });
});
