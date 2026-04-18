import { describe, expect, it } from "vitest";
import { createStrokeTrialEngine } from "./strokeTrialEngine.js";

describe("createStrokeTrialEngine", () => {
  it("tracks pace and finishes at stroke quota with twelljr label", () => {
    const eng = createStrokeTrialEngine({
      trialStrokeCount: 10,
      goalLevelId: "J",
      scoringProfile: "twelljr",
    });
    let t = 10_000;
    for (let i = 0; i < 10; i++) {
      eng.applyEmielStep((t += 40), i, i + 1);
    }
    const r = eng.getRenderState(t);
    expect(r.finished).toBe(true);
    expect(r.confirmedStrokeCount).toBe(10);
    expect(r.resultLevelId).not.toBeNull();
  });

  it("reset clears progress", () => {
    const eng = createStrokeTrialEngine({
      trialStrokeCount: 4,
      goalLevelId: "J",
      scoringProfile: "twelljr",
    });
    eng.applyEmielStep(100, 0, 1);
    eng.reset({ trialStrokeCount: 4, goalLevelId: "J", scoringProfile: "twelljr" });
    const r = eng.getRenderState(200);
    expect(r.confirmedStrokeCount).toBe(0);
    expect(r.finished).toBe(false);
    expect(r.resultLevelId).toBeNull();
  });

  it("freezes elapsedMs at completion (does not grow with wall clock after finish)", () => {
    const eng = createStrokeTrialEngine({
      trialStrokeCount: 3,
      goalLevelId: "J",
      scoringProfile: "twelljr",
    });
    eng.applyEmielStep(1_000, 0, 1);
    eng.applyEmielStep(2_000, 1, 2);
    eng.applyEmielStep(5_000, 2, 3);
    const atFinish = eng.getRenderState(5_000);
    expect(atFinish.finished).toBe(true);
    expect(atFinish.elapsedMs).toBe(4_000);
    const muchLater = eng.getRenderState(999_000);
    expect(muchLater.elapsedMs).toBe(4_000);
  });

  it("markWallClockStart makes elapsed tick from display time; reactionLatency tracks first stroke", () => {
    const eng = createStrokeTrialEngine({
      trialStrokeCount: 3,
      goalLevelId: "J",
      scoringProfile: "twelljr",
    });
    eng.markWallClockStart(1_000);
    expect(eng.getRenderState(1_500).elapsedMs).toBe(500);
    expect(eng.getRenderState(1_500).reactionLatencyMs).toBe(500);
    eng.applyEmielStep(2_000, 0, 1);
    expect(eng.getRenderState(2_000).elapsedMs).toBe(1_000);
    expect(eng.getRenderState(2_000).reactionLatencyMs).toBe(1_000);
    expect(eng.getRenderState(9_000).reactionLatencyMs).toBe(1_000);
  });
});
