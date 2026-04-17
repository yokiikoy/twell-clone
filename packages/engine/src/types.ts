export type GameMode = "kihon" | "katakana" | "kanji" | "kanyoku";

export type PaceColor = "blue" | "yellow" | "red" | "neutral";

export interface WordEntry {
  surface: string;
  reading: string;
  /** ローマ字 `reading` から生成したひらがな（emiel の打鍵ターゲット）。 */
  typingKana: string;
  mode: GameMode;
  /** 複数 JSON を束ねたときのデッキ番号（合成出題の重み付けに使用）。 */
  sourceDeck?: 1 | 2 | 3;
}

export interface WordListFile {
  version: number;
  source?: string;
  words: WordEntry[];
}

/** `legacy` = ReadMe-style `level.ts`; `twelljr` = `Module1` ladder (`twellJrLabelFromTotalSeconds`). */
export type ScoringProfile = "legacy" | "twelljr";

export interface TrialConfig {
  /** Total keys in a trial (国語Ｒ: 400) */
  trialKeyCount: number;
  mode: GameMode;
  dictionary: WordEntry[];
  /** Deterministic RNG seed */
  rngSeed: number;
  /** Goal level id for pace color (e.g. "J") */
  goalLevelId: string;
  /** When true, show romaji overlay for current word */
  romanGuideEnabled: boolean;
  /**
   * Finished-trial label source. Defaults to `legacy` for backward compatibility.
   * Phase A web uses `twelljr` + `Jou` sample dictionary.
   */
  scoringProfile?: ScoringProfile;
}

/** One row of the trial (表層 + ローマ字); `reading.length` sums to `targetReading.length`. */
export interface TrialSegmentView {
  surface: string;
  /** Lowercase romaji chunk for this segment (same as engine `WordEntry.reading`). */
  reading: string;
  readingLen: number;
}

export interface TrialRenderState {
  surface: string;
  /** Full trial target string */
  targetReading: string;
  keyIndex: number;
  currentWordIndex: number;
  /** Romaji guide for the active word only */
  romanGuide: string;
  /** Ordered segments for full-line 表層表示（国語Ｒは全文を一度に出す） */
  trialSegments: readonly TrialSegmentView[];
  progress01: number;
  paceColor: PaceColor;
  /** Milliseconds elapsed since trial start (wall) */
  elapsedMs: number;
  finished: boolean;
  /** Level id if trial finished and level applies */
  resultLevelId: string | null;
}
