import { toHiragana } from "wanakana";

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
 * BAS `reading`（ASCII ローマ字・公式の先頭表記）→ emiel Mozc 用のひらがな列。
 * 表層の漢字・カタカナとは独立（表示は `surface` のまま）。
 *
 * 注: 打鍵中のローマ字処理は **emiel** がターゲットかなから行う。本関数は試行前の
 * `typingKana` 生成など **静的変換**にのみ使う（wanakana はキー入力ごとには動かない）。
 */
export function romajiToTypingKana(romaji: string): string {
  const s = normalizeBasRomajiForWanakana(romaji);
  if (!s) return "";
  return toHiragana(s);
}
