import { mozcMinStrokesForHiraganaLine } from "../emielStrokeBudget.js";
import type { GameMode } from "../types.js";
import { jouTriplesToWordEntries } from "../twelljr/jouSample.js";

/** Mozc/emiel shortest stroke count for one triple row (matches Web `TypingCanvas` path). */
export function mozcMinStrokesForTriple(
  surface: string,
  reading: string,
  mode: GameMode
): number {
  const [w] = jouTriplesToWordEntries(
    [{ surface, reading, code: "", index: 0 }],
    mode
  );
  return mozcMinStrokesForHiraganaLine(w.typingKana);
}
