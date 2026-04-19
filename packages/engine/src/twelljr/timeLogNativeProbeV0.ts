import {
  parseTimeLogStubDataLineV1,
  type ParsedTimeLogStubRowV1,
} from "./timeLogStubLine.js";

/**
 * Heuristic line bucket until a **redacted native** `Time*.log` sample is checked in under
 * `fixtures/timelog-native/` (see docs/re/analysis/08-time-log-native-format-v0.md).
 */
export type TimeLogLineKindV0 =
  | "empty"
  | "comment"
  | "web_v1"
  | "native_candidate_tab"
  | "native_unknown";

export type TimeLogLineProbeV0 = {
  lineIndex1: number;
  raw: string;
  kind: TimeLogLineKindV0;
  webV1?: ParsedTimeLogStubRowV1;
  /** Present when `kind === "native_candidate_tab"` */
  cells?: string[];
};

/** First column looks like `yyyy/mm/dd`, `yyyy-mm-dd`, or `yyyy.mm.dd` (common JP locale). */
const NATIVE_DATE_FIRST_CELL = /^\d{4}[/.\-]\d{1,2}[/.\-]\d{1,2}\b/;

function classifyTrimmedLine(trimmed: string): Omit<TimeLogLineProbeV0, "lineIndex1" | "raw"> {
  if (!trimmed) return { kind: "empty" };
  if (trimmed.startsWith("#")) return { kind: "comment" };
  const web = parseTimeLogStubDataLineV1(trimmed);
  if (web) return { kind: "web_v1", webV1: web };
  const cells = trimmed.split("\t");
  if (
    cells.length >= 2 &&
    cells[0] != null &&
    NATIVE_DATE_FIRST_CELL.test(cells[0].trim())
  ) {
    return { kind: "native_candidate_tab", cells };
  }
  return { kind: "native_unknown" };
}

const emptyCounts = (): Record<TimeLogLineKindV0, number> => ({
  empty: 0,
  comment: 0,
  web_v1: 0,
  native_candidate_tab: 0,
  native_unknown: 0,
});

/**
 * Line-by-line probe: WEB_V1 rows, **unverified** native-like tab rows (date in col0), and leftovers.
 */
export function probeTimeLogTextV0(input: string): {
  lines: TimeLogLineProbeV0[];
  counts: Record<TimeLogLineKindV0, number>;
} {
  const rawLines = input.split(/\r?\n/);
  const lines: TimeLogLineProbeV0[] = [];
  const counts = emptyCounts();
  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i];
    const trimmed = raw.trim();
    const base = classifyTrimmedLine(trimmed);
    counts[base.kind]++;
    lines.push({
      lineIndex1: i + 1,
      raw,
      ...base,
    });
  }
  return { lines, counts };
}
