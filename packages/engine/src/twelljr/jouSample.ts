import type { GameMode, WordEntry } from "../types.js";
import { romajiToTypingKana } from "./romajiTypingKana.js";

/** 表層が平仮名のみ（長音・々含む）なら `typingKana` は表層をそのまま使う（reading→wanakana と揃える・差異を避ける）。 */
function isPlainHiraganaSurface(surface: string): boolean {
  const s = surface.normalize("NFC");
  return /^[\u3041-\u3096\u30fc\u309D\u309E]+$/.test(s);
}

/** Minimal Jou1-style row from export / fixture (`twjrdecomp/Jou1.bas` pattern). */
export interface JouTripleRow {
  surface: string;
  reading: string;
  /** あればそれを優先（手動補正・将来の抽出列用）。省略時は `reading` から生成。 */
  typingKana?: string;
  code: string;
  index: number;
}

export function jouTriplesToWordEntries(
  rows: readonly JouTripleRow[],
  mode: GameMode = "kihon"
): WordEntry[] {
  return rows.map((r) => {
    const reading = r.reading.toLowerCase();
    const typingKana =
      r.typingKana ??
      (isPlainHiraganaSurface(r.surface)
        ? r.surface.normalize("NFC")
        : romajiToTypingKana(reading));
    return {
      surface: r.surface,
      reading,
      typingKana,
      mode,
    };
  });
}
