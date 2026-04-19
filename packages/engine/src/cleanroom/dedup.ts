import type { GameMode } from "../types.js";

/** Row shape after ingest / before final WordEntry conversion. */
export interface CleanroomCandidateRow {
  surface: string;
  normalized: string;
  reading: string;
  mode: GameMode;
}

/**
 * Mode-scoped dedup: first wins per `normalized`, then per `surface` (same-reading collision policy).
 */
export function dedupeCleanroomCandidates(
  rows: readonly CleanroomCandidateRow[]
): CleanroomCandidateRow[] {
  const seenNorm = new Set<string>();
  const seenSurface = new Set<string>();
  const out: CleanroomCandidateRow[] = [];
  for (const r of rows) {
    const nk = `${r.mode}\t${r.normalized}`;
    const sk = `${r.mode}\t${r.surface}`;
    if (seenNorm.has(nk)) continue;
    if (seenSurface.has(sk)) continue;
    seenNorm.add(nk);
    seenSurface.add(sk);
    out.push(r);
  }
  return out;
}
