import type { GameMode } from "../types.js";
import {
  timeLogBasename,
  timeLogSuffixForGameMode,
  type TimeLogSuffix,
} from "./logContracts.js";

const ALL_TIME_SUFFIXES: readonly TimeLogSuffix[] = [
  "KHJY",
  "KTKN",
  "KNJ",
  "KTWZ",
];

const TIME_SUFFIX_SET: ReadonlySet<string> = new Set(ALL_TIME_SUFFIXES);

/** One row of persisted trial summary used only for stub text export. */
export type TimeLogStubLineSourceV1 = {
  id: string;
  savedAt: string;
  gameMode: GameMode;
  elapsedMs: number;
  resultLevelId: string | null;
  missCount: number;
};

/**
 * Preamble for a downloadable `.txt` that groups stub lines (not split per `TimeKHJY.log` file yet).
 * Native VB logs are unverified here — treat as a traceability bridge only.
 */
export const TIME_LOG_STUB_V1_FILE_PREAMBLE =
  "# TWJR_TIMELOG_STUB_V1 — not official VB Time*.log bytes; see docs/spec/d-phase-prep-local-store.md\n" +
  "# Tab columns: marker, savedAt (ISO-8601), suffix (KHJY|KTKN|KNJ|KTWZ), elapsedSec, module1Label, missCount, id\n";

/**
 * Single stub record. Marker `WEB_V1` allows future real `Time*.log` parsers to ignore or branch.
 */
export function formatTimeLogStubLineV1(src: TimeLogStubLineSourceV1): string {
  const suffix = timeLogSuffixForGameMode(src.gameMode);
  const sec = (src.elapsedMs / 1000).toFixed(3);
  const label = src.resultLevelId ?? "";
  return [
    "WEB_V1",
    src.savedAt,
    suffix,
    sec,
    label,
    String(src.missCount),
    src.id,
  ].join("\t");
}

export function buildTimeLogStubFileBodyV1(
  sources: readonly TimeLogStubLineSourceV1[]
): string {
  const sorted = [...sources].sort((a, b) => a.savedAt.localeCompare(b.savedAt));
  const body = sorted.map(formatTimeLogStubLineV1).join("\n");
  return TIME_LOG_STUB_V1_FILE_PREAMBLE + (body ? `${body}\n` : "");
}

function perSuffixPreamble(suffix: TimeLogSuffix): string {
  return (
    TIME_LOG_STUB_V1_FILE_PREAMBLE +
    `# stub-filename: ${timeLogBasename(suffix)} (only rows with suffix column ${suffix})\n`
  );
}

/** One body per official `Time*.log` name — still WEB_V1 stub lines, not native bytes. */
export function buildTimeLogStubPerSuffixBodiesV1(
  sources: readonly TimeLogStubLineSourceV1[]
): Record<TimeLogSuffix, string> {
  const out = {} as Record<TimeLogSuffix, string>;
  for (const suffix of ALL_TIME_SUFFIXES) {
    const subset = sources.filter(
      (s) => timeLogSuffixForGameMode(s.gameMode) === suffix
    );
    const sorted = [...subset].sort((a, b) => a.savedAt.localeCompare(b.savedAt));
    const body = sorted.map(formatTimeLogStubLineV1).join("\n");
    out[suffix] = perSuffixPreamble(suffix) + (body ? `${body}\n` : "");
  }
  return out;
}

export type ParsedTimeLogStubRowV1 = {
  marker: "WEB_V1";
  savedAt: string;
  suffix: TimeLogSuffix;
  elapsedSec: number;
  module1Label: string;
  missCount: number;
  id: string;
};

/** Parses one trimmed line; returns `null` if it is not a valid `WEB_V1` data row. */
export function parseTimeLogStubDataLineV1(line: string): ParsedTimeLogStubRowV1 | null {
  const parts = line.split("\t");
  if (parts[0] !== "WEB_V1" || parts.length !== 7) return null;
  const [, savedAt, suffixRaw, secStr, module1Label, missStr, id] = parts;
  if (!suffixRaw || !TIME_SUFFIX_SET.has(suffixRaw)) return null;
  const suffix = suffixRaw as TimeLogSuffix;
  const elapsedSec = Number(secStr);
  const missCount = Number(missStr);
  if (!Number.isFinite(elapsedSec) || !Number.isFinite(missCount)) return null;
  return {
    marker: "WEB_V1",
    savedAt,
    suffix,
    elapsedSec,
    module1Label,
    missCount,
    id,
  };
}

/**
 * Parses lines emitted by `formatTimeLogStubLineV1` (marker `WEB_V1`, tab-separated).
 * Native VB `Time*.log` lines (without this marker) are skipped with issues for visibility.
 */
export function parseTimeLogStubFileTextV1(input: string): {
  rows: ParsedTimeLogStubRowV1[];
  issues: string[];
} {
  const issues: string[] = [];
  const rows: ParsedTimeLogStubRowV1[] = [];
  const lines = input.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;
    const row = parseTimeLogStubDataLineV1(line);
    if (row) {
      rows.push(row);
      continue;
    }
    const parts = line.split("\t");
    issues.push(`L${i + 1}: skip non-WEB_V1 (${parts.length} cols): ${line.slice(0, 100)}`);
  }
  return { rows, issues };
}
