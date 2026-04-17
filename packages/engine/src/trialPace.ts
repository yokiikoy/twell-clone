import { approximateSecondsForLevel } from "./level.js";
import type { PaceColor } from "./types.js";

export const TRIAL_PACE_EMA_ALPHA = 0.25;
export const TRIAL_PACE_YELLOW_RATIO = 1.12;

/** Pace color from inter-stroke EMA vs goal level (国語Ｒは `keysPerTrial` 固定 400 など). */
export function paceFromIntervalEma(
  intervalEmaMs: number | null,
  goalLevelId: string,
  keysPerTrial: number
): PaceColor {
  if (intervalEmaMs == null) return "neutral";
  const targetSec = approximateSecondsForLevel(goalLevelId);
  const targetIntervalMs = (targetSec * 1000) / keysPerTrial;
  if (intervalEmaMs <= targetIntervalMs) return "blue";
  if (intervalEmaMs <= targetIntervalMs * TRIAL_PACE_YELLOW_RATIO) return "yellow";
  return "red";
}
