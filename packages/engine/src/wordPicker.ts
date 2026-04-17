import type { GameMode, WordEntry } from "./types.js";
import { mozcMinStrokesForHiraganaLine } from "./emielStrokeBudget.js";
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
 * emiel 用の **ひらがな** 行（語ごとの `typingKana` をスペース連結）。
 * `typingKana` は BAS のローマ字 `reading` から生成（[`romajiToTypingKana`](./twelljr/romajiTypingKana.ts)）。
 *
 * 停止条件: 連結した行に対し **emiel の最短ローマ打鍵数**（`mozcMinStrokesForHiraganaLine`）が
 * `trialStrokeCount + reserveMinStrokes` 以上になるまで語をランダムに追加する。
 * 経験係数は使わない（QWERTY JIS 固定で emiel と同じ前提）。
 */
export function buildTrialSurfaceLine(
  dict: WordEntry[],
  mode: GameMode,
  trialStrokeCount: number,
  rand: Random,
  avoidRepeatWindow: number,
  reserveMinStrokes = 8
): { words: WordEntry[]; emielTargetLine: string } {
  const pool = wordsForMode(dict, mode);
  if (pool.length === 0) {
    throw new Error(`No dictionary entries for mode ${mode}`);
  }
  const targetMinStrokes = trialStrokeCount + reserveMinStrokes;
  const picked: WordEntry[] = [];
  const recent: string[] = [];
  let guard = 0;
  const lineStrokes = (words: WordEntry[]) =>
    words.length === 0
      ? 0
      : mozcMinStrokesForHiraganaLine(words.map((w) => w.typingKana).join(" "));

  while (lineStrokes(picked) < targetMinStrokes && guard < trialStrokeCount * 80) {
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
