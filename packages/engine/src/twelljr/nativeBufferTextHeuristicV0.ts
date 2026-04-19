/**
 * Decide whether a buffer is plausibly **line-oriented text** (UTF-8 / CP932 style)
 * vs binary — used to avoid offering “行取り込み” on Dtld/Bptn/Poor binaries.
 */

import { decodeNativeTextFileBestEffort } from "./nativeTextArtifactV0.js";

/** Fraction of UTF-8 codepoints in [32,127] ∪ tab/LF/CR (sample capped). */
export function asciiHeavyTextRatioV0(text: string, maxCodePoints = 8000): number {
  let n = 0;
  let ok = 0;
  for (const ch of text) {
    if (n >= maxCodePoints) break;
    n++;
    const c = ch.codePointAt(0)!;
    if (c === 9 || c === 10 || c === 13) ok++;
    else if (c >= 32 && c < 127) ok++;
  }
  return n === 0 ? 0 : ok / n;
}

/**
 * `true` if the file is likely human-readable line text (Boot/JRmemo style),
 * `false` for UTF-16-ish or float-heavy binaries.
 */
export function bufferLooksLikeLineOrientedTextLogV0(u8: Uint8Array): boolean {
  const sampleLen = Math.min(u8.length, 12_000);
  const slice = u8.subarray(0, sampleLen);
  let nul = 0;
  for (let i = 0; i < slice.length; i++) {
    if (slice[i] === 0) nul++;
  }
  if (nul / slice.length > 0.08) return false;

  const { text } = decodeNativeTextFileBestEffort(slice);
  const repl = (text.match(/\uFFFD/g) ?? []).length;
  if (repl > 6 && repl / Math.max(text.length, 1) > 0.02) return false;

  const ratio = asciiHeavyTextRatioV0(text);
  return ratio >= 0.72;
}
