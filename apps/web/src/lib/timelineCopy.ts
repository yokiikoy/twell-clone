import type {
  NativeImportFloat32BlobV1,
  NativeImportPastBinaryV1,
  NativeImportRecordV1,
  NativeImportTimeBinaryV1,
  UnifiedTimelineEntryV1,
} from "@/lib/localStore";

function isTimeLikeBinaryNative(n: NativeImportRecordV1): n is NativeImportTimeBinaryV1 {
  return (
    n.artifactKind === "time_binary_v0" ||
    n.artifactKind === "dtld_binary_v0" ||
    n.artifactKind === "bptn_binary_v0" ||
    n.artifactKind === "poor_binary_v0"
  );
}

function isPastBinaryNative(n: NativeImportRecordV1): n is NativeImportPastBinaryV1 {
  return n.artifactKind === "past_binary_v0";
}

function isFloat32BlobNative(n: NativeImportRecordV1): n is NativeImportFloat32BlobV1 {
  return (
    n.artifactKind === "dtld_float32_blob_v0" ||
    n.artifactKind === "bptn_float32_blob_v0" ||
    n.artifactKind === "poor_float32_blob_v0"
  );
}

/** Tab-separated line for spreadsheets / future stub tooling (“延長線”). */
export function formatTimelineRowCopyLine(entry: UnifiedTimelineEntryV1): string {
  if (entry.source === "web") {
    const w = entry.web;
    return [
      "WEB_TRIAL_V1",
      w.savedAt,
      w.gameMode,
      (w.elapsedMs / 1000).toFixed(3),
      w.resultLevelId ?? "",
      String(w.missCount),
      w.deckCaption,
    ].join("\t");
  }
  const { native } = entry;
  if (isPastBinaryNative(native)) {
    const r = native.record;
    return [
      "NATIVE_PAST_BINARY_V0",
      String(native.recordIndex),
      r.dateAscii,
      String(r.valueF32),
      String(r.valueI32),
    ].join("\t");
  }
  if (isFloat32BlobNative(native)) {
    const head = native.floatPreviewHead.slice(0, 12).map((x) => String(x));
    return [
      "NATIVE_FLOAT32_BLOB_V0",
      native.artifactKind,
      native.timeLogSuffix ?? "",
      String(native.floatCount),
      native.headerLabel ?? "",
      ...head,
    ].join("\t");
  }
  if (isTimeLikeBinaryNative(native)) {
    const r = native.record;
    const parts: string[] = [
      "NATIVE_TIME_LIKE_BINARY_V0",
      native.artifactKind,
      native.timeLogSuffix ?? "",
      String(native.recordIndex),
      r.dateAscii,
      r.timeAscii,
      r.clockAscii,
      String(r.int32),
      ...r.floats1.map((x) => String(x)),
    ];
    if (r.floats2.length > 0) {
      parts.push(String(r.int322), r.dateAscii2, ...r.floats2.map((x) => String(x)));
    }
    return parts.join("\t");
  }
  return [
    "NATIVE_TEXT_LINE_V0",
    native.artifactKind,
    native.timeLogSuffix ?? "",
    String(native.recordIndex),
    native.textLine,
  ].join("\t");
}
