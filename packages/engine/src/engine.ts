import { levelFromTotalSeconds } from "./level.js";
import { mulberry32 } from "./rng.js";
import type {
  ScoringProfile,
  TrialConfig,
  TrialRenderState,
  WordEntry,
} from "./types.js";
import { twellJrLabelFromTotalSeconds } from "./twelljr/module1Core.js";
import { buildTrialReading } from "./wordPicker.js";
import { paceFromIntervalEma, TRIAL_PACE_EMA_ALPHA } from "./trialPace.js";

export interface TrialEngine {
  onKeyDown(key: string, nowMs: number): void;
  tick(nowMs: number): void;
  /** Pass the same monotonic clock (ms) used for input. */
  getRenderState(nowMs: number): TrialRenderState;
}

interface InternalState {
  targetReading: string;
  words: WordEntry[];
  keyIndex: number;
  trialKeyCount: number;
  startedAtMs: number | null;
  finishedAtMs: number | null;
  lastKeyAtMs: number | null;
  lastNowMs: number;
  intervalEmaMs: number | null;
  rng: () => number;
  goalLevelId: string;
  romanGuideEnabled: boolean;
  scoringProfile: ScoringProfile;
}

function wordBounds(
  words: WordEntry[],
  keyIndex: number
): { wordIndex: number; offsetInWord: number; surface: string; guide: string } {
  if (words.length === 0) {
    return { wordIndex: 0, offsetInWord: 0, surface: "", guide: "" };
  }
  let pos = 0;
  for (let wi = 0; wi < words.length; wi++) {
    const w = words[wi]!;
    const len = w.reading.length;
    if (keyIndex < pos + len) {
      return {
        wordIndex: wi,
        offsetInWord: keyIndex - pos,
        surface: w.surface,
        guide: w.reading,
      };
    }
    pos += len;
  }
  const last = words[words.length - 1]!;
  return {
    wordIndex: words.length - 1,
    offsetInWord: last.reading.length,
    surface: last.surface,
    guide: last.reading,
  };
}

export function createTrialEngine(config: TrialConfig): TrialEngine {
  const rand = mulberry32(config.rngSeed >>> 0);
  const { words, reading } = buildTrialReading(
    config.dictionary,
    config.mode,
    config.trialKeyCount,
    rand,
    8
  );

  const scoringProfile = config.scoringProfile ?? "legacy";

  const s: InternalState = {
    targetReading: reading,
    words,
    keyIndex: 0,
    trialKeyCount: config.trialKeyCount,
    startedAtMs: null,
    finishedAtMs: null,
    lastKeyAtMs: null,
    lastNowMs: 0,
    intervalEmaMs: null,
    rng: rand,
    goalLevelId: config.goalLevelId,
    romanGuideEnabled: config.romanGuideEnabled,
    scoringProfile,
  };

  const render = (nowMs: number): TrialRenderState => {
    const finished = s.keyIndex >= s.trialKeyCount;
    const caretIdx = finished
      ? Math.max(0, s.trialKeyCount - 1)
      : Math.min(s.keyIndex, Math.max(0, s.trialKeyCount - 1));
    const wb = wordBounds(s.words, caretIdx);
    const trialSegments = s.words.map((w) => ({
      surface: w.surface,
      reading: w.reading,
      readingLen: w.reading.length,
    }));
    const elapsedMs =
      s.startedAtMs != null ? nowMs - s.startedAtMs : 0;
    let resultLevelId: string | null = null;
    if (finished && s.startedAtMs != null && s.finishedAtMs != null) {
      const sec = (s.finishedAtMs - s.startedAtMs) / 1000;
      resultLevelId =
        s.scoringProfile === "twelljr"
          ? twellJrLabelFromTotalSeconds(sec)
          : levelFromTotalSeconds(sec);
    }
    return {
      surface: wb.surface,
      targetReading: s.targetReading,
      keyIndex: s.keyIndex,
      currentWordIndex: wb.wordIndex,
      romanGuide: s.romanGuideEnabled ? wb.guide : "",
      trialSegments,
      progress01: s.keyIndex / s.trialKeyCount,
      paceColor: paceFromIntervalEma(
        s.intervalEmaMs,
        s.goalLevelId,
        s.trialKeyCount
      ),
      elapsedMs,
      finished,
      resultLevelId,
    };
  };

  return {
    onKeyDown(key: string, nowMs: number) {
      if (s.keyIndex >= s.trialKeyCount) return;
      const normalized = key.toLowerCase();
      if (normalized.length !== 1 || !/^[a-z-]$/.test(normalized)) return;

      s.lastNowMs = nowMs;
      if (s.startedAtMs == null) s.startedAtMs = nowMs;
      if (s.lastKeyAtMs != null) {
        const dt = nowMs - s.lastKeyAtMs;
        s.intervalEmaMs =
          s.intervalEmaMs == null
            ? dt
            : s.intervalEmaMs * (1 - TRIAL_PACE_EMA_ALPHA) + dt * TRIAL_PACE_EMA_ALPHA;
      }
      s.lastKeyAtMs = nowMs;

      const expected = s.targetReading[s.keyIndex]!.toLowerCase();
      if (normalized === expected) {
        s.keyIndex++;
        if (s.keyIndex >= s.trialKeyCount) s.finishedAtMs = nowMs;
      }
    },
    tick(nowMs: number) {
      s.lastNowMs = nowMs;
    },
    getRenderState(nowMs: number) {
      return render(nowMs);
    },
  };
}
