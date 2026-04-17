export type {
  GameMode,
  PaceColor,
  ScoringProfile,
  TrialConfig,
  TrialRenderState,
  TrialSegmentView,
  WordEntry,
  WordListFile,
} from "./types.js";
export { levelFromTotalSeconds, approximateSecondsForLevel } from "./level.js";
export { mulberry32 } from "./rng.js";
export { parseDetailLogText } from "./detailLogParse.js";
export { createTrialEngine } from "./engine.js";
export type { TrialEngine } from "./engine.js";
export {
  createStrokeTrialEngine,
  type StrokeTrialConfig,
  type StrokeTrialEngine,
  type StrokeTrialRenderState,
} from "./strokeTrialEngine.js";
export {
  buildTrialReading,
  buildTrialSurfaceLine,
  buildTrialSurfaceLineMerged,
  MERGED_WEIGHTS_KANJI,
  MERGED_WEIGHTS_KATAKANA,
  MERGED_WEIGHTS_KIHON,
  MERGED_WEIGHTS_KANYOKU,
  type MergedSurfaceLineWeightSpec,
} from "./wordPicker.js";
export { mozcMinStrokesForHiraganaLine } from "./emielStrokeBudget.js";
export { romajiToTypingKana } from "./twelljr/romajiTypingKana.js";
export {
  basRomanTypingGuide,
  longestBasReadingPrefixForTypedKana,
} from "./twelljr/basRomanTypingGuide.js";
export {
  MODULE1_CHART_LABEL_ORDER,
  twellJrBigRunFontFamilyHint,
  twellJrGoalKeyPacing,
  twellJrLabelFromTotalSeconds,
} from "./twelljr/module1Core.js";
export type { GoalKeyPacing } from "./twelljr/module1Core.js";
export { jouTriplesToWordEntries } from "./twelljr/jouSample.js";
export type { JouTripleRow } from "./twelljr/jouSample.js";
export {
  detailLogBasename,
  patternLogBasename,
  poorLogBasename,
  timeLogBasename,
  twlSlotBasename,
} from "./twelljr/logContracts.js";
export type { TimeLogSuffix } from "./twelljr/logContracts.js";
