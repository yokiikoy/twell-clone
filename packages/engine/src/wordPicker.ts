import type { GameMode, WordEntry } from "./types.js";
import { romajiToTypingKana } from "./twelljr/romajiTypingKana.js";

type Random = () => number;

/** When a trial cuts mid-word, show a proportional prefix of `surface` (kana fixtures are BMP). */
function surfacePrefixForPartialWord(
  surface: string,
  fullReadingLen: number,
  partialLen: number
): string {
  if (surface.length === 0) return surface;
  if (fullReadingLen <= 0 || partialLen <= 0) return surface.slice(0, 1);
  const n = Math.max(
    1,
    Math.min(
      surface.length,
      Math.round((partialLen / fullReadingLen) * surface.length)
    )
  );
  return surface.slice(0, n);
}

function wordsForMode(dict: WordEntry[], mode: GameMode): WordEntry[] {
  return dict.filter((w) => w.mode === mode);
}

/**
 * emiel ターゲット行の「打鍵見積り単位」: 各語の `typingKana` 文字数 + 語間スペース（`TypingCanvas` の進捗と同じ尺）。
 */
function emielLineTypingUnits(words: readonly WordEntry[]): number {
  if (words.length === 0) return 0;
  let n = words.length - 1;
  for (const w of words) n += w.typingKana.length;
  return n;
}

/**
 * 語を拾いすぎないための停止用バジェット。`typingKana` だけだと 1 文字語が多いときに語数が膨らむので、
 * BAS の `reading` 長（概ねローマ字打鍵の目安）を同時に見る。
 */
function linePickBudgetUnits(words: readonly WordEntry[]): number {
  if (words.length === 0) return 0;
  let n = words.length - 1;
  for (const w of words) {
    const tk = w.typingKana.length;
    const rk = Math.ceil(w.reading.length / 2.5);
    n += Math.max(tk, rk);
  }
  return n;
}

/**
 * Build exactly `trialKeyCount` keys from random words (same mode).
 * Last word may be logically truncated for display; `reading` length always matches.
 */
export function buildTrialReading(
  dict: WordEntry[],
  mode: GameMode,
  trialKeyCount: number,
  rand: Random,
  avoidRepeatWindow: number
): { words: WordEntry[]; reading: string } {
  const pool = wordsForMode(dict, mode);
  if (pool.length === 0) {
    throw new Error(`No dictionary entries for mode ${mode}`);
  }
  const picked: WordEntry[] = [];
  const recent: string[] = [];
  let reading = "";
  let guard = 0;
  while (reading.length < trialKeyCount && guard < trialKeyCount * 30) {
    guard++;
    const w = pool[Math.floor(rand() * pool.length)]!;
    const sig = `${w.surface}\0${w.reading}`;
    if (recent.includes(sig) && pool.length > avoidRepeatWindow) continue;
    picked.push(w);
    reading += w.reading;
    recent.push(sig);
    if (recent.length > avoidRepeatWindow) recent.shift();
  }

  const pad = pool[0]!.reading;
  while (reading.length < trialKeyCount) {
    picked.push(pool[0]!);
    reading += pad;
  }
  reading = reading.slice(0, trialKeyCount);
  const words: WordEntry[] = [];
  let pos = 0;
  for (const w of picked) {
    if (pos >= reading.length) break;
    const take = Math.min(w.reading.length, reading.length - pos);
    if (take <= 0) break;
    const sliceRead = reading.slice(pos, pos + take);
    if (take === w.reading.length) {
      words.push(w);
    } else {
      words.push({
        surface: surfacePrefixForPartialWord(
          w.surface,
          w.reading.length,
          take
        ),
        reading: sliceRead,
        typingKana: romajiToTypingKana(sliceRead),
        mode: w.mode,
      });
    }
    pos += take;
  }
  return { words, reading };
}

/**
 * emiel の `finishedStroke.length` は **ローマ字の確定ストローク**（かな 1 文字あたり複数になりがち）。
 * 表示行の「かな＋語間スペース」尺を `trialStrokeCount` と 1:1 にすると、試行終了時に行の半分付近で止まるため、
 * 目標尺を係数で縮める（実測に近い ~0.52 を既定。必要なら呼び出し側で調整）。
 */
const DEFAULT_KANA_UNITS_PER_TRIAL_STROKE = 0.52;

/**
 * emiel 用の **ひらがな** 行（語ごとの `typingKana` をスペース連結）。
 * `typingKana` は BAS のローマ字 `reading` から生成（[`romajiToTypingKana`](./twelljr/romajiTypingKana.ts)）。
 *
 * 停止は `linePickBudgetUnits` と `emielLineTypingUnits` がともに
 * `targetKanaUnits + reserveTypingUnits` / `targetKanaUnits` に達するまで。
 * `targetKanaUnits = ceil(trialStrokeCount * kanaUnitsPerTrialStroke)`。
 */
export function buildTrialSurfaceLine(
  dict: WordEntry[],
  mode: GameMode,
  trialStrokeCount: number,
  rand: Random,
  avoidRepeatWindow: number,
  reserveTypingUnits = 8,
  kanaUnitsPerTrialStroke = DEFAULT_KANA_UNITS_PER_TRIAL_STROKE
): { words: WordEntry[]; emielTargetLine: string } {
  const pool = wordsForMode(dict, mode);
  if (pool.length === 0) {
    throw new Error(`No dictionary entries for mode ${mode}`);
  }
  const targetKanaUnits = Math.max(
    8,
    Math.ceil(trialStrokeCount * kanaUnitsPerTrialStroke)
  );
  const targetBudget = targetKanaUnits + reserveTypingUnits;
  const picked: WordEntry[] = [];
  const recent: string[] = [];
  let guard = 0;
  while (
    !(
      linePickBudgetUnits(picked) >= targetBudget &&
      emielLineTypingUnits(picked) >= targetKanaUnits
    ) &&
    guard < trialStrokeCount * 80
  ) {
    guard++;
    const w = pool[Math.floor(rand() * pool.length)]!;
    const sig = `${w.surface}\0${w.reading}`;
    if (recent.includes(sig) && pool.length > avoidRepeatWindow) continue;
    picked.push(w);
    recent.push(sig);
    if (recent.length > avoidRepeatWindow) recent.shift();
  }
  if (picked.length === 0) {
    picked.push(pool[0]!);
  }
  const emielTargetLine = picked.map((w) => w.typingKana).join(" ");
  return { words: picked, emielTargetLine };
}
