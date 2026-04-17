import { levelFromTotalSeconds } from "./level.js";
import {
  paceFromIntervalEma,
  TRIAL_PACE_EMA_ALPHA,
} from "./trialPace.js";
import type { PaceColor, ScoringProfile } from "./types.js";
import { twellJrLabelFromTotalSeconds } from "./twelljr/module1Core.js";

export interface StrokeTrialConfig {
  /** Quota for confirmed strokes (e.g. emiel `finishedStroke.length`). */
  trialStrokeCount: number;
  goalLevelId: string;
  scoringProfile?: ScoringProfile;
}

/** Trial progress driven by an external IME (emiel); engine owns timing, pace, and labels. */
export interface StrokeTrialRenderState {
  confirmedStrokeCount: number;
  trialStrokeCount: number;
  progress01: number;
  paceColor: PaceColor;
  elapsedMs: number;
  finished: boolean;
  resultLevelId: string | null;
}

export interface StrokeTrialEngine {
  /**
   * Call after each external `input()` when `before` / `after` are
   * `finishedStroke.length` (or equivalent confirmed-stroke counts).
   */
  applyEmielStep(nowMs: number, before: number, after: number): void;
  getRenderState(nowMs: number): StrokeTrialRenderState;
  reset(config: StrokeTrialConfig): void;
}

interface Internal {
  trialStrokeCount: number;
  goalLevelId: string;
  scoringProfile: ScoringProfile;
  startedAtMs: number | null;
  finishedAtMs: number | null;
  lastKeyAtMs: number | null;
  intervalEmaMs: number | null;
  lastStrokeCount: number;
}

function renderState(s: Internal, nowMs: number): StrokeTrialRenderState {
  const cap = s.trialStrokeCount;
  const stroke = Math.min(s.lastStrokeCount, cap);
  const finished = s.finishedAtMs != null && stroke >= cap;
  const elapsedMs =
    s.startedAtMs == null
      ? 0
      : s.finishedAtMs != null
        ? s.finishedAtMs - s.startedAtMs
        : nowMs - s.startedAtMs;
  let resultLevelId: string | null = null;
  if (finished && s.startedAtMs != null && s.finishedAtMs != null) {
    const sec = (s.finishedAtMs - s.startedAtMs) / 1000;
    resultLevelId =
      s.scoringProfile === "twelljr"
        ? twellJrLabelFromTotalSeconds(sec)
        : levelFromTotalSeconds(sec);
  }
  return {
    confirmedStrokeCount: stroke,
    trialStrokeCount: cap,
    progress01: stroke / cap,
    paceColor: paceFromIntervalEma(
      s.intervalEmaMs,
      s.goalLevelId,
      cap
    ),
    elapsedMs,
    finished,
    resultLevelId,
  };
}

export function createStrokeTrialEngine(
  initial: StrokeTrialConfig
): StrokeTrialEngine {
  const s: Internal = {
    trialStrokeCount: initial.trialStrokeCount,
    goalLevelId: initial.goalLevelId,
    scoringProfile: initial.scoringProfile ?? "legacy",
    startedAtMs: null,
    finishedAtMs: null,
    lastKeyAtMs: null,
    intervalEmaMs: null,
    lastStrokeCount: 0,
  };

  return {
    reset(config: StrokeTrialConfig) {
      s.trialStrokeCount = config.trialStrokeCount;
      s.goalLevelId = config.goalLevelId;
      s.scoringProfile = config.scoringProfile ?? "legacy";
      s.startedAtMs = null;
      s.finishedAtMs = null;
      s.lastKeyAtMs = null;
      s.intervalEmaMs = null;
      s.lastStrokeCount = 0;
    },

    applyEmielStep(nowMs: number, before: number, after: number) {
      if (s.finishedAtMs != null) return;
      if (before >= s.trialStrokeCount) return;

      const cap = s.trialStrokeCount;

      if (after > before) {
        if (s.startedAtMs == null) s.startedAtMs = nowMs;
        if (s.lastKeyAtMs != null) {
          const dt = nowMs - s.lastKeyAtMs;
          s.intervalEmaMs =
            s.intervalEmaMs == null
              ? dt
              : s.intervalEmaMs * (1 - TRIAL_PACE_EMA_ALPHA) +
                dt * TRIAL_PACE_EMA_ALPHA;
        }
        s.lastKeyAtMs = nowMs;
      }

      s.lastStrokeCount = Math.min(after, cap);

      if (after >= cap && s.finishedAtMs == null) {
        s.finishedAtMs = nowMs;
      }
    },

    getRenderState(nowMs: number) {
      return renderState(s, nowMs);
    },
  };
}
