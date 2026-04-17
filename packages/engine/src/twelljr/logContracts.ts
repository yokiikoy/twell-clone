/**
 * TWellJR log / slot filenames (Phase D stub — align with docs/re/analysis/03-io-contracts.md).
 */

export type TimeLogSuffix = "KHJY" | "KTKN" | "KNJ" | "KTWZ";

export function timeLogBasename(suffix: TimeLogSuffix): string {
  return `Time${suffix}.log`;
}

export function detailLogBasename(suffix: TimeLogSuffix): string {
  return `Dtld${suffix}.log`;
}

export function patternLogBasename(suffix: TimeLogSuffix): string {
  return `Bptn${suffix}.log`;
}

export function poorLogBasename(suffix: TimeLogSuffix): string {
  return `Poor${suffix}.log`;
}

/** Slot file stem used by heavy-user UI (`0.twl` … `3.twl`). */
export function twlSlotBasename(slotIndex: 0 | 1 | 2 | 3): string {
  return `${slotIndex}.twl`;
}
