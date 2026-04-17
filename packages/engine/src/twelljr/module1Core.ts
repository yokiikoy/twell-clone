/**
 * TWellJR `Module1.bas` — `Proc_1_0_51B39C` / `Proc_1_1_52F7B4` faithful port.
 * Source of truth: docs/re/analysis/04-domain-typing.md (Wave 2 table).
 */

/** Upper bound (exclusive) → label; first match wins (`LtR8` ladder). */
const LABEL_LADDER: readonly (readonly [number, string])[] = [
  [10, "ZS"],
  [12, "ZA"],
  [14, "ZB"],
  [16, "ZC"],
  [18, "ZD"],
  [20, "ZE"],
  [22, "ZF"],
  [24, "ZG"],
  [26, "ZH"],
  [28, "ZI"],
  [30, "ZJ"],
  [32, "XX"],
  [34, "XS"],
  [36, "XA"],
  [38, "XB"],
  [40, "XC"],
  [42, "XD"],
  [44, "XE"],
  [46, "XF"],
  [48, "XG"],
  [50, "XH"],
  [52, "XI"],
  [54, "XJ"],
  [56, "SS"],
  [58, "SA"],
  [60, "SB"],
  [62, "SC"],
  [64, "SD"],
  [66, "SE"],
  [68, "SF"],
  [70, "SG"],
  [72, "SH"],
  [74, "SI"],
  [76, "SJ"],
  [80, "A"],
  [86, "B"],
  [94, "C"],
  [104, "D"],
  [116, "E"],
  [130, "F"],
  [146, "G"],
  [164, "H"],
  [184, "I"],
  [206, "J"],
] as const;

/** Module1 chart letters in ladder order (ZS … J); for segment UI only. */
export const MODULE1_CHART_LABEL_ORDER: readonly string[] = LABEL_LADDER.map(([, l]) => l);

/**
 * Total trial seconds (`arg_C` as Single) → chart letter / dash.
 * Matches VB: `>=206` uses `GeR8` → `"-"`.
 */
export function twellJrLabelFromTotalSeconds(seconds: number): string {
  if (seconds >= 206) return "-";
  for (const [max, label] of LABEL_LADDER) {
    if (seconds < max) return label;
  }
  return "J";
}

/** Trailing font branch after ladder (`arg_C` vs 76 / `0x4C`). */
export function twellJrBigRunFontFamilyHint(seconds: number): "ms-gothic" | "ms-pgothic" {
  return seconds < 76 ? "ms-gothic" : "ms-pgothic";
}

export interface GoalKeyPacing {
  /** `FMemStUI1 arg_8(100)` */
  field100: number;
  /** `FMemStI4 arg_8(104)` */
  field104: number;
}

const H = (n: number) => n;

/** `Proc_1_1_52F7B4` — single-character goal key → pacing fields; unknown → `null`. */
export function twellJrGoalKeyPacing(goalKey: string): GoalKeyPacing | null {
  if (goalKey.length !== 1) return null;
  const table: Record<string, GoalKeyPacing> = {
    A: { field100: 25, field104: H(0x31) },
    B: { field100: 41, field104: H(0x31) },
    C: { field100: 39, field104: H(0x31) },
    D: { field100: 27, field104: H(0x31) },
    E: { field100: 15, field104: H(0x31) },
    F: { field100: 28, field104: H(0x31) },
    G: { field100: 29, field104: H(0x31) },
    H: { field100: 30, field104: H(0x30) },
    I: { field100: 20, field104: H(0x30) },
    J: { field100: 31, field104: H(0x30) },
    K: { field100: 32, field104: H(0x30) },
    L: { field100: 33, field104: H(0x30) },
    M: { field100: 43, field104: H(0x30) },
    N: { field100: 42, field104: H(0x30) },
    O: { field100: 21, field104: H(0x30) },
    P: { field100: 22, field104: H(0x30) },
    Q: { field100: 13, field104: H(0x31) },
    R: { field100: 16, field104: H(0x31) },
    S: { field100: 26, field104: H(0x31) },
    T: { field100: 17, field104: H(0x31) },
    U: { field100: 19, field104: H(0x30) },
    V: { field100: 40, field104: H(0x31) },
    W: { field100: 14, field104: H(0x31) },
    X: { field100: 38, field104: H(0x31) },
    Y: { field100: 18, field104: H(0x30) },
    Z: { field100: 37, field104: H(0x31) },
    a: { field100: 25, field104: H(0x63) },
    b: { field100: 41, field104: H(0x63) },
    c: { field100: 39, field104: H(0x63) },
    d: { field100: 27, field104: H(0x63) },
    e: { field100: 15, field104: H(0x63) },
    f: { field100: 28, field104: H(0x63) },
    g: { field100: 29, field104: H(0x63) },
    h: { field100: 30, field104: H(0x63) },
    i: { field100: 20, field104: H(0x63) },
    j: { field100: 31, field104: H(0x63) },
    k: { field100: 32, field104: H(0x63) },
    l: { field100: 33, field104: H(0x63) },
    m: { field100: 43, field104: H(0x63) },
    n: { field100: 42, field104: H(0x63) },
    o: { field100: 21, field104: H(0x63) },
    p: { field100: 22, field104: H(0x63) },
    q: { field100: 13, field104: H(0x63) },
    r: { field100: 16, field104: H(0x63) },
    s: { field100: 26, field104: H(0x63) },
    t: { field100: 17, field104: H(0x63) },
    u: { field100: 19, field104: H(0x63) },
    v: { field100: 40, field104: H(0x63) },
    w: { field100: 14, field104: H(0x63) },
    x: { field100: 38, field104: H(0x63) },
    y: { field100: 18, field104: H(0x63) },
    z: { field100: 37, field104: H(0x63) },
    "1": { field100: 0, field104: H(0x63) },
    "2": { field100: 1, field104: H(0x63) },
    "3": { field100: 2, field104: H(0x63) },
    "4": { field100: 3, field104: H(0x63) },
    "5": { field100: 4, field104: H(0x63) },
    "6": { field100: 5, field104: H(0x63) },
    "7": { field100: 6, field104: H(0x63) },
    "8": { field100: 7, field104: H(0x63) },
    "9": { field100: 8, field104: H(0x63) },
    "0": { field100: 9, field104: H(0x63) },
    $: { field100: 3, field104: H(0x31) },
    "'": { field100: 6, field104: H(0x30) },
    "-": { field100: 10, field104: H(0x63) },
    ",": { field100: 44, field104: H(0x63) },
    ".": { field100: 45, field104: H(0x63) },
    _: { field100: 50, field104: H(0x63) },
  };
  return table[goalKey] ?? null;
}
