import { describe, expect, it } from "vitest";
import { createTrialEngine } from "./engine.js";
import type { WordEntry } from "./types.js";

const dict: WordEntry[] = [
  { surface: "あ", reading: "a", typingKana: "あ", mode: "kihon" },
  { surface: "い", reading: "i", typingKana: "い", mode: "kihon" },
];

describe("createTrialEngine", () => {
  it("completes a short trial and computes level", () => {
    const eng = createTrialEngine({
      trialKeyCount: 4,
      mode: "kihon",
      dictionary: dict,
      rngSeed: 42,
      goalLevelId: "J",
      romanGuideEnabled: true,
    });
    let t = 1000;
    const r0 = eng.getRenderState(t);
    expect(r0.romanGuide.length).toBeGreaterThan(0);
    const target = r0.targetReading;
    expect(target.length).toBe(4);
    for (const ch of target) {
      eng.onKeyDown(ch, (t += 50));
    }
    const r1 = eng.getRenderState(t);
    expect(r1.finished).toBe(true);
    expect(r1.resultLevelId).not.toBeNull();
  });

  it("uses Module1 ladder when scoringProfile is twelljr", () => {
    const eng = createTrialEngine({
      trialKeyCount: 4,
      mode: "kihon",
      dictionary: dict,
      rngSeed: 42,
      goalLevelId: "J",
      romanGuideEnabled: true,
      scoringProfile: "twelljr",
    });
    let t = 1000;
    const target = eng.getRenderState(t).targetReading;
    for (const ch of target) {
      eng.onKeyDown(ch, (t += 50));
    }
    const r = eng.getRenderState(t);
    expect(r.finished).toBe(true);
    expect(r.resultLevelId).toBe("ZS");
  });
});
