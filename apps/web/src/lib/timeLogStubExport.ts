import {
  buildTimeLogStubFileBodyV1,
  buildTimeLogStubPerSuffixBodiesV1,
  timeLogBasename,
  type GameMode,
  type TimeLogSuffix,
  type TimeLogStubLineSourceV1,
} from "@typewell-jr/engine";
import { listTrialSessionsDescending, type LocalTrialSessionRecordV1 } from "./localStore";

const ZIP_SUFFIX_ORDER: readonly TimeLogSuffix[] = [
  "KHJY",
  "KTKN",
  "KNJ",
  "KTWZ",
];

function asGameMode(s: string): GameMode | null {
  if (s === "kihon" || s === "katakana" || s === "kanji" || s === "kanyoku") {
    return s;
  }
  return null;
}

function recordToStubSource(
  r: LocalTrialSessionRecordV1
): TimeLogStubLineSourceV1 | null {
  const gameMode = asGameMode(r.gameMode);
  if (!gameMode) return null;
  return {
    id: r.id,
    savedAt: r.savedAt,
    gameMode,
    elapsedMs: r.elapsedMs,
    resultLevelId: r.resultLevelId,
    missCount: r.missCount,
  };
}

async function trialStubSourcesFromLocal(): Promise<TimeLogStubLineSourceV1[]> {
  const records = await listTrialSessionsDescending(10_000);
  return records
    .map(recordToStubSource)
    .filter((x): x is TimeLogStubLineSourceV1 => x != null);
}

/** All saved trials → one stub `.txt` (not one file per `TimeKHJY.log` yet). */
export async function exportTrialSessionsTimeLogStubTxt(): Promise<string> {
  const sources = await trialStubSourcesFromLocal();
  return buildTimeLogStubFileBodyV1(sources);
}

/** Four `Time*.log`-named stub bodies in a single ZIP (still WEB_V1 stub lines). */
export async function exportTrialSessionsTimeLogStubZip(): Promise<Blob> {
  const { zipSync } = await import("fflate");
  const sources = await trialStubSourcesFromLocal();
  const bodies = buildTimeLogStubPerSuffixBodiesV1(sources);
  const enc = new TextEncoder();
  const files: Record<string, Uint8Array> = {};
  for (const suffix of ZIP_SUFFIX_ORDER) {
    files[timeLogBasename(suffix)] = enc.encode(bodies[suffix]);
  }
  const zipped = zipSync(files, { level: 0 });
  return new Blob([new Uint8Array(zipped)], { type: "application/zip" });
}
