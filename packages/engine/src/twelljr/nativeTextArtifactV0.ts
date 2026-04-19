/**
 * Boot.txt / JRmemo.txt — line-based text import (V0 spike).
 * No verified VB layout; we store raw non-empty lines with optional date heuristic for sort.
 */

import { inferNativeTextLogArtifactFromFilename } from "./nativeLogFamilyFilenameV0.js";
import type { NativeLogTextArtifactKindV0 } from "./nativeLogFamilyFilenameV0.js";
import { parseNativeDateTimeUtcMs } from "./nativeTimelineSortV0.js";

export type NativeTextArtifactKindV0 = NativeLogTextArtifactKindV0;

export function inferBootOrJrmemoArtifactKind(
  filename: string
): "boot_txt_v0" | "jrmemo_txt_v0" | null {
  const r = inferNativeTextLogArtifactFromFilename(filename);
  if (!r) return null;
  if (r.artifactKind === "boot_txt_v0" || r.artifactKind === "jrmemo_txt_v0") {
    return r.artifactKind;
  }
  return null;
}

function normalizeNewlines(s: string): string {
  return s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

/**
 * Prefer UTF-8; if replacement chars suggest mojibake, fall back to Shift_JIS
 * (browser `TextDecoder` label).
 */
export function decodeNativeTextFileBestEffort(bytes: Uint8Array): {
  text: string;
  encodingLabel: "utf-8" | "shift_jis";
} {
  const utf8 = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  const repl = utf8.split("\uFFFD").length - 1;
  const ratio = repl / Math.max(utf8.length, 1);
  if (repl <= 2 && ratio < 0.015) {
    return { text: normalizeNewlines(utf8), encodingLabel: "utf-8" };
  }
  const sj = new TextDecoder("shift_jis", { fatal: false }).decode(bytes);
  return { text: normalizeNewlines(sj), encodingLabel: "shift_jis" };
}

export function splitNativeTextLinesV0(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.replace(/\r$/, "").trimEnd())
    .filter((l) => l.length > 0);
}

/**
 * If the line contains `yyyy/mm/dd` (optional `H:MM:SS` elsewhere on the line),
 * use that for timeline sort; else `fallbackBaseMs + lineIndex` (file order as time proxy).
 */
export function sortMsFromNativeTextLineV0(
  line: string,
  fallbackBaseMs: number,
  lineIndex: number
): number {
  const dm = /(\d{4})\/(\d{1,2})\/(\d{1,2})/.exec(line);
  if (dm) {
    const dateStr = `${dm[1]}/${dm[2]}/${dm[3]}`;
    const tm = /(\d{1,2}):(\d{2}):(\d{2})/.exec(line);
    const timeStr = tm ? `${tm[1]}:${tm[2]}:${tm[3]}` : "12:00:00";
    const ms = parseNativeDateTimeUtcMs(dateStr, timeStr);
    if (ms != null) {
      return ms + Math.min(lineIndex, 999);
    }
  }
  const base = Number.isFinite(fallbackBaseMs) ? fallbackBaseMs : 0;
  return base + lineIndex;
}
