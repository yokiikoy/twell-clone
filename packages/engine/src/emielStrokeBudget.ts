import type { Rule } from "emiel";
import {
  build,
  createDirectInputRule,
  loadPresetKeyboardLayoutQwertyJis,
  loadPresetRuleRoman,
  type KeyboardLayout,
} from "emiel";

/**
 * Mozc ローマ字ルールにキーボード直接入力を合成する（語間スペース U+0020 等）。
 * emiel 0.1 の `rule.getRoman(layout)` が内部で行っていた合成と同等。
 */
export function mozcRomanRuleForKeyboard(layout: KeyboardLayout): Rule {
  return loadPresetRuleRoman(layout).compose(createDirectInputRule(layout));
}

let cachedLayout: KeyboardLayout | null = null;

function qwertyJisLayout(): KeyboardLayout {
  if (!cachedLayout) cachedLayout = loadPresetKeyboardLayoutQwertyJis();
  return cachedLayout;
}

/**
 * emiel が構築した Mozc 系オートマトンにおいて、**空入力から**そのかな行を
 * 最短経路で打ち終えるのに要するストローク数（`pendingStroke.length` の初期値）。
 * 語間スペースはターゲット文字列に含めたまま渡す（例: `あ い`）。
 *
 * `layout` は **実プレイで `build(mozcRomanRuleForKeyboard(layout), …)` に渡すのと同じ**にすること。
 * 省略時は QWERTY JIS（サーバ・テスト用）。ブラウザで検出した配列とズレると、
 * 最短打鍵数の見積りと実オートマトンが一致せず、400 打鍵前にターゲットが尽きることがある。
 */
export function mozcMinStrokesForHiraganaLine(
  kanaLine: string,
  layout?: KeyboardLayout
): number {
  const s = kanaLine.normalize("NFC");
  if (!s) return 0;
  const romanLayout = layout ?? qwertyJisLayout();
  const auto = build(mozcRomanRuleForKeyboard(romanLayout), s);
  return auto.getPendingStroke().length;
}
