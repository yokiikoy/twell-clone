/**
 * TWellJR log / slot filenames (Phase D stub — align with docs/re/analysis/03-io-contracts.md).
 */

import type { GameMode } from "../types.js";

export type TimeLogSuffix = "KHJY" | "KTKN" | "KNJ" | "KTWZ";

/** Maps Web / engine `GameMode` to the four `Time*.log` filename stems from 03-io-contracts. */
export function timeLogSuffixForGameMode(mode: GameMode): TimeLogSuffix {
  switch (mode) {
    case "kihon":
      return "KHJY";
    case "katakana":
      return "KTKN";
    case "kanji":
      return "KNJ";
    case "kanyoku":
      return "KTWZ";
    default: {
      const _never: never = mode;
      return _never;
    }
  }
}

export function timeLogBasename(suffix: TimeLogSuffix): string {
  return `Time${suffix}.log`;
}

const TIME_LOG_BASENAME_RE = /^Time(KHJY|KTKN|KNJ|KTWZ)\.log$/i;

/** If `filename` is a basename like `TimeKTKN.log`, returns its suffix; else `null`. */
export function inferTimeLogSuffixFromFilename(filename: string): TimeLogSuffix | null {
  const base = filename.replace(/^.*[/\\]/, "").trim();
  const m = TIME_LOG_BASENAME_RE.exec(base);
  if (!m) return null;
  const suf = m[1].toUpperCase();
  if (suf === "KHJY" || suf === "KTKN" || suf === "KNJ" || suf === "KTWZ") {
    return suf;
  }
  return null;
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
