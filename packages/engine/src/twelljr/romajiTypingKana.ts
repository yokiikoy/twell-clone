import { toHiragana } from "wanakana";
import { tsuikyoRomaToKanaPairs } from "./tsuikyoRomaToKanaPairs.gen.js";

/**
 * BAS 系ローマ字は「ん」を子音前に `nn` と綴ることが多く、wanakana は `nn` を「んん」と解釈する。
 * 本家 reading を wanakana に渡す前に、よくあるパターンへ潰す（完全ではないが `hunnbaru` 等を救う）。
 */
export function normalizeBasRomajiForWanakana(romaji: string): string {
  let t = romaji.trim().toLowerCase();
  if (!t) return t;
  t = t.replace(/([aeiou])n{3,}([aeiou])/g, (_, a: string, b: string) => `${a}nn${b}`);
  let prev = "";
  while (prev !== t) {
    prev = t;
    t = t.replace(/nn(?=[bcdfghjkmprstvwxyz])/g, "n");
    t = t.replace(/nn$/g, "n");
  }
  return t;
}

/**
 * [tsuikyo](https://github.com/tomoemon/tsuikyo) `romaTable` の string エントリを逆引きした
 * 最長一致貪欲変換。`ん`/`っ` の動的ルールは含まないため、パース不能時のみ wanakana にフォールバックする。
 */
function tsuikyoGreedyRomajiToHiragana(lowerAscii: string): string | null {
  let i = 0;
  let out = "";
  while (i < lowerAscii.length) {
    let hit = false;
    for (const { roma, kana } of tsuikyoRomaToKanaPairs) {
      if (lowerAscii.startsWith(roma, i)) {
        out += kana;
        i += roma.length;
        hit = true;
        break;
      }
    }
    if (!hit) return null;
  }
  return out;
}

/**
 * BAS `reading`（ASCII ローマ字・公式の先頭表記）→ emiel Mozc 用のひらがな列。
 * 表層の漢字・カタカナとは独立（表示は `surface` のまま）。
 *
 * 主に [tsuikyo](https://github.com/tomoemon/tsuikyo) のローマかな表に基づく。
 * 打鍵中のローマ字は **emiel**（オートマトンの `finishedRoman` / `pendingRoman`）。
 */
export function romajiToTypingKana(romaji: string): string {
  const s = normalizeBasRomajiForWanakana(romaji);
  if (!s) return "";
  const g = tsuikyoGreedyRomajiToHiragana(s);
  if (g !== null) return g;
  return toHiragana(s);
}
