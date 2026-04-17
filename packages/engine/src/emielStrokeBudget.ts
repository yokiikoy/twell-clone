import { keyboard, rule, type KeyboardLayout } from "emiel";

let cachedLayout: ReturnType<typeof keyboard.getQwertyJis> | null = null;

function qwertyJisLayout(): ReturnType<typeof keyboard.getQwertyJis> {
  if (!cachedLayout) cachedLayout = keyboard.getQwertyJis();
  return cachedLayout;
}

/**
 * emiel が構築した Mozc 系オートマトンにおいて、**空入力から**そのかな行を
 * 最短経路で打ち終えるのに要するストローク数（`pendingStroke.length` の初期値）。
 * 語間スペースはターゲット文字列に含めたまま渡す（例: `あ い`）。
 *
 * `layout` は **実プレイで `rule.getRoman(layout).build(…)` に渡すのと同じ**にすること。
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
  const auto = rule.getRoman(romanLayout).build(s);
  return auto.pendingStroke.length;
}
