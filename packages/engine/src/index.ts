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
export {
  mozcMinStrokesForHiraganaLine,
  mozcRomanRuleForKeyboard,
} from "./emielStrokeBudget.js";
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
export { dedupeCleanroomCandidates } from "./cleanroom/dedup.js";
export type { CleanroomCandidateRow } from "./cleanroom/dedup.js";
export { mozcMinStrokesForTriple } from "./cleanroom/joinStrokes.js";
export {
  detailLogBasename,
  inferTimeLogSuffixFromFilename,
  patternLogBasename,
  poorLogBasename,
  timeLogBasename,
  timeLogSuffixForGameMode,
  twlSlotBasename,
} from "./twelljr/logContracts.js";
export {
  parseNativeDateTimeUtcMs,
  timeBinaryV0SortMs,
} from "./twelljr/nativeTimelineSortV0.js";
export {
  decodeNativeTextFileBestEffort,
  inferBootOrJrmemoArtifactKind,
  sortMsFromNativeTextLineV0,
  splitNativeTextLinesV0,
} from "./twelljr/nativeTextArtifactV0.js";
export type { NativeTextArtifactKindV0 } from "./twelljr/nativeTextArtifactV0.js";
export { bufferLooksLikeLineOrientedTextLogV0 } from "./twelljr/nativeBufferTextHeuristicV0.js";
export {
  formatUint8HeadHexV0,
  looksLikeTwlSlotTextSerializationV0,
} from "./twelljr/twlSlotTextSerializationV0.js";
export {
  inferNativeFloatBlobArtifactFromFilename,
  looksLikeBptnPoorFloat32ScoresBlobV0,
  looksLikeDtldPackedNativeV0,
  parseDtldPackedNativeFileV0,
  parseNativeFloat32BlobFileV0,
} from "./twelljr/dtldBptnPoorFloatBlobV0.js";
export type {
  DtldPackedNativeParseV0,
  NativeFloatBlobArtifactKindV0,
  NativeFloatBlobInferV0,
} from "./twelljr/dtldBptnPoorFloatBlobV0.js";
export {
  inferNativeBinaryTimeLikeArtifactFromFilename,
  inferNativeTextLogArtifactFromFilename,
} from "./twelljr/nativeLogFamilyFilenameV0.js";
export type {
  NativeBinaryTimeLikeArtifactKindV0,
  NativeBinaryTimeLikeInferV0,
  NativeLogTextArtifactKindV0,
  NativeTextLogInferV0,
} from "./twelljr/nativeLogFamilyFilenameV0.js";
export {
  looksLikePastLogBinaryV0,
  parsePastLogBinaryRecordV0,
  parsePastLogFileV0,
  pastLogDateDdMmYySortMs,
  PAST_LOG_RECORD_STRIDE_V0,
} from "./twelljr/pastLogBinaryV0.js";
export type { PastLogBinaryRecordV0 } from "./twelljr/pastLogBinaryV0.js";
export type { TimeLogSuffix } from "./twelljr/logContracts.js";
export {
  buildTimeLogStubFileBodyV1,
  buildTimeLogStubPerSuffixBodiesV1,
  formatTimeLogStubLineV1,
  parseTimeLogStubDataLineV1,
  parseTimeLogStubFileTextV1,
  TIME_LOG_STUB_V1_FILE_PREAMBLE,
  type ParsedTimeLogStubRowV1,
  type TimeLogStubLineSourceV1,
} from "./twelljr/timeLogStubLine.js";
export {
  probeTimeLogTextV0,
  type TimeLogLineKindV0,
  type TimeLogLineProbeV0,
} from "./twelljr/timeLogNativeProbeV0.js";
export {
  looksLikeTimeKHJYBinaryV0,
  parseTimeKHJYBinaryRecordV0,
  parseTimeKHJYLogFileV0,
  type TimeKHJYBinaryRecordV0,
} from "./twelljr/timeKHJYLogBinaryV0.js";
