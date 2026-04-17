/**
 * Tier definitions from ReadMe.txt (total trial seconds, 400 keys).
 * For **TWellJR.exe–faithful** chart letters / dash, use `twellJrLabelFromTotalSeconds`
 * from `./twelljr/module1Core.js` (see docs/re/analysis/04-domain-typing.md).
 */

const TIER1 = ["J", "I", "H", "G", "F", "E", "D", "C", "B", "A"] as const;
const TIER2 = ["SJ", "SI", "SH", "SG", "SF", "SE", "SD", "SC", "SB", "SA"] as const;
const TIER3 = ["SS", "XJ", "XI", "XH", "XG", "XF", "XE", "XD", "XC", "XB"] as const;
const TIER4 = ["XA", "XS", "XX", "ZJ", "ZI", "ZH", "ZG"] as const;

function subdivide(
  totalSeconds: number,
  minSec: number,
  maxSec: number,
  labels: readonly string[]
): string {
  const span = maxSec - minSec;
  const fromSlowEnd = maxSec - totalSeconds;
  const idx = Math.min(
    labels.length - 1,
    Math.floor((fromSlowEnd / span) * labels.length)
  );
  return labels[idx] ?? labels[0];
}

/** Total trial duration in seconds → level label; `null` if too slow (≥206s). */
export function levelFromTotalSeconds(totalSeconds: number): string | null {
  if (totalSeconds >= 206) return null;
  if (totalSeconds >= 76) return subdivide(totalSeconds, 76, 206, TIER1);
  if (totalSeconds >= 56) return subdivide(totalSeconds, 56, 76, TIER2);
  if (totalSeconds >= 36) return subdivide(totalSeconds, 36, 56, TIER3);
  return subdivide(totalSeconds, 0, 36, TIER4);
}

/** Rough seconds threshold for a level (lower = faster). Used for goal pace only. */
export function approximateSecondsForLevel(levelId: string): number {
  const i1 = TIER1.indexOf(levelId as (typeof TIER1)[number]);
  if (i1 >= 0) return 206 - ((i1 + 0.5) / TIER1.length) * (206 - 76);
  const i2 = TIER2.indexOf(levelId as (typeof TIER2)[number]);
  if (i2 >= 0) return 76 - ((i2 + 0.5) / TIER2.length) * (76 - 56);
  const i3 = TIER3.indexOf(levelId as (typeof TIER3)[number]);
  if (i3 >= 0) return 56 - ((i3 + 0.5) / TIER3.length) * (56 - 36);
  const i4 = TIER4.indexOf(levelId as (typeof TIER4)[number]);
  if (i4 >= 0) return 36 - ((i4 + 0.5) / TIER4.length) * 36;
  return 120;
}
