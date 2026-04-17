import type { WordEntry } from "../types.js";
import { romajiToTypingKana } from "./romajiTypingKana.js";

/**
 * BAS 由来の「本家に近い」ローマ字ガイド（表層ではなく `WordEntry.reading` 列）。
 * 打鍵の正否は emiel。ここはあくまで視線誘導用で、
 * [tsuikyo](https://github.com/tomoemon/tsuikyo) のローマかな表と同系の「語単位の綴り」を優先する。
 */

function nfc(s: string): string {
  return s.normalize("NFC");
}

/**
 * `fullReading` の接頭辞 `r` のうち、`romajiToTypingKana(r) === typedKana` となる最長の `r`。
 * 見つからなければ `""`（typed が空、または不整合）。
 */
export function longestBasReadingPrefixForTypedKana(
  fullReading: string,
  typedKana: string
): string {
  if (!typedKana) return "";
  const fr = fullReading.toLowerCase();
  let best = "";
  for (let i = 0; i <= fr.length; i++) {
    const sub = fr.slice(0, i);
    if (romajiToTypingKana(sub) === typedKana) best = sub;
  }
  return best;
}

function joinTargetTypingKana(segments: readonly WordEntry[]): string {
  return segments.map((w) => w.typingKana).join(" ");
}

function joinTrialReadingLine(segments: readonly WordEntry[]): string {
  return segments.map((w) => w.reading.toLowerCase()).join(" ");
}

function longestCommonPrefix(a: string, b: string): string {
  const n = Math.min(a.length, b.length);
  let i = 0;
  while (i < n && a[i] === b[i]) i++;
  return a.slice(0, i);
}

/**
 * @param emielTargetLine `segments.map(w => w.typingKana).join(" ")` と一致していること
 */
export function basRomanTypingGuide(
  segments: readonly WordEntry[],
  emielTargetLine: string,
  finishedKana: string
): { finishedRoman: string; pendingRoman: string } {
  const target = nfc(emielTargetLine);
  const built = nfc(joinTargetTypingKana(segments));
  if (target !== built) {
    return { finishedRoman: "", pendingRoman: joinTrialReadingLine(segments) };
  }

  let fk = nfc(finishedKana);
  if (!target.startsWith(fk)) {
    fk = longestCommonPrefix(fk, target);
  }

  let pos = 0;
  let finishedRoman = "";

  for (let wi = 0; wi < segments.length; wi++) {
    const w = segments[wi]!;
    if (wi > 0) {
      if (pos >= target.length || target[pos] !== " ") {
        return {
          finishedRoman,
          pendingRoman: joinTrialReadingLine(segments).slice(finishedRoman.length),
        };
      }
      if (pos < fk.length) {
        if (fk[pos] !== " ") {
          fk = fk.slice(0, pos);
          break;
        }
        finishedRoman += " ";
        pos++;
      } else {
        const rest = joinTrialReadingLine(segments).slice(finishedRoman.length);
        return { finishedRoman, pendingRoman: rest };
      }
    }

    const tk = nfc(w.typingKana);
    const wordEnd = pos + tk.length;
    const typedInWord = fk.slice(pos, Math.min(fk.length, wordEnd));

    if (fk.length >= wordEnd) {
      if (typedInWord !== tk) {
        fk = fk.slice(0, pos + longestCommonPrefix(typedInWord, tk).length);
        const rest = joinTrialReadingLine(segments).slice(finishedRoman.length);
        return { finishedRoman, pendingRoman: rest };
      }
      finishedRoman += w.reading.toLowerCase();
      pos = wordEnd;
      continue;
    }

    const rp = longestBasReadingPrefixForTypedKana(w.reading.toLowerCase(), typedInWord);
    finishedRoman += rp;
    const fullLine = joinTrialReadingLine(segments);
    const pending = fullLine.slice(finishedRoman.length);
    return { finishedRoman, pendingRoman: pending };
  }

  const fullLine = joinTrialReadingLine(segments);
  return { finishedRoman, pendingRoman: fullLine.slice(finishedRoman.length) };
}
