import { keyboard, rule } from "emiel";

let cachedLayout: ReturnType<typeof keyboard.getQwertyJis> | null = null;

function qwertyJisLayout(): ReturnType<typeof keyboard.getQwertyJis> {
  if (!cachedLayout) cachedLayout = keyboard.getQwertyJis();
  return cachedLayout;
}

/**
 * emiel が構築した Mozc 系オートマトンにおいて、**空入力から**そのかな行を
 * 最短経路で打ち終えるのに要するストローク数（`pendingStroke.length` の初期値）。
 * 語間スペースはターゲット文字列に含めたまま渡す（例: `あ い`）。
 */
export function mozcMinStrokesForHiraganaLine(kanaLine: string): number {
  const s = kanaLine.normalize("NFC");
  if (!s) return 0;
  const auto = rule.getRoman(qwertyJisLayout()).build(s);
  return auto.pendingStroke.length;
}
