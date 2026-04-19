import { levelFromTotalSeconds } from "./level.js";
import {
  paceFromIntervalEma,
  TRIAL_PACE_EMA_ALPHA,
} from "./trialPace.js";
import type { PaceColor, ScoringProfile } from "./types.js";
import { twellJrLabelFromTotalSeconds } from "./twelljr/module1Core.js";

export interface StrokeTrialConfig {
  /** Quota for confirmed strokes (e.g. emiel `currentView().finishedStroke.length`). */
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
  /**
   * タイマー開始（ワード表示など）から初回確定ストロークまでの ms。
   * 初打鍵前は `nowMs` に応じて増えるライブ値、初打鍵後は確定値で固定。
   * タイマー起点が初打鍵のみのとき（`markWallClockStart` 未使用）は常に 0。
   */
  reactionLatencyMs: number;
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
  /**
   * ワードセット表示（試行 UI が入力可能になった瞬間）の壁時計。
   * 初打鍵より前に呼ぶと `elapsedMs` が表示起点から進み、初打鍵までの差分が `reactionLatencyMs` に集約される。
   * 二重呼び出しは無視。
   */
  markWallClockStart(nowMs: number): void;
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
  /** 初回確定ストロークの時刻（`reactionLatencyMs` 確定用） */
  firstStrokeAtMs: number | null;
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
  const reactionLatencyMs =
    s.startedAtMs == null
      ? 0
      : stroke >= 1 && s.firstStrokeAtMs != null
        ? s.firstStrokeAtMs - s.startedAtMs
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
    reactionLatencyMs,
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
    firstStrokeAtMs: null,
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
      s.firstStrokeAtMs = null;
    },

    markWallClockStart(nowMs: number) {
      if (s.finishedAtMs != null) return;
      if (s.startedAtMs != null) return;
      s.startedAtMs = nowMs;
    },

    applyEmielStep(nowMs: number, before: number, after: number) {
      if (s.finishedAtMs != null) return;
      if (before >= s.trialStrokeCount) return;

      const cap = s.trialStrokeCount;

      if (after > before) {
        if (s.firstStrokeAtMs == null) s.firstStrokeAtMs = nowMs;
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
