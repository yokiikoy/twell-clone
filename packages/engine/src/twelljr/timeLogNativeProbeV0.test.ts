import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { probeTimeLogTextV0 } from "./timeLogNativeProbeV0.js";

const twelljrDir = dirname(fileURLToPath(import.meta.url));

describe("probeTimeLogTextV0", () => {
  it("classifies synthetic native candidate fixture", () => {
    const path = join(twelljrDir, "../../fixtures/timelog-native/synthetic-candidate-v0.txt");
    const text = readFileSync(path, "utf8");
    const { counts, lines } = probeTimeLogTextV0(text);
    expect(counts.native_candidate_tab).toBe(1);
    expect(counts.comment).toBeGreaterThanOrEqual(1);
    const cand = lines.find((l) => l.kind === "native_candidate_tab");
    expect(cand?.cells?.[0]).toBe("2006/04/17");
    expect(cand?.cells?.[1]).toBe("12:34:56");
  });

  it("prefers web_v1 over native_candidate when both heuristics could apply", () => {
    const line =
      "WEB_V1\t2026-04-01T10:00:00.000Z\tKHJY\t1.000\t\t0\tid-x";
    const { counts } = probeTimeLogTextV0(line);
    expect(counts.web_v1).toBe(1);
    expect(counts.native_candidate_tab).toBe(0);
  });

  it("counts mixed stub + synthetic native", () => {
    const text = [
      "# c",
      "WEB_V1\t2026-01-01T00:00:00.000Z\tKNJ\t2.000\tB\t1\tu1",
      "2007/05/05\ta\tb",
      "not a data line",
      "",
    ].join("\n");
    const { counts } = probeTimeLogTextV0(text);
    expect(counts.comment).toBe(1);
    expect(counts.web_v1).toBe(1);
    expect(counts.native_candidate_tab).toBe(1);
    expect(counts.native_unknown).toBe(1);
    expect(counts.empty).toBe(1);
  });
});
