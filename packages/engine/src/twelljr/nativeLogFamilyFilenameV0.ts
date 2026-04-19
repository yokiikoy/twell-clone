/**
 * Map known native log basenames → import artifact kinds (V0).
 *
 * **Time-like binary** (`time_binary_v0` / `dtld_binary_v0` / …): only use when
 * `looksLikeTimeKHJYBinaryV0` is true — Dtld/Bptn/Poor are often **not** 120B Time
 * layout (see Dropbox samples); the filename kind is for tagging after probe passes.
 */

import type { TimeLogSuffix } from "./logContracts.js";

export type NativeBinaryTimeLikeArtifactKindV0 =
  | "time_binary_v0"
  | "dtld_binary_v0"
  | "bptn_binary_v0"
  | "poor_binary_v0";

export type NativeLogTextArtifactKindV0 =
  | "boot_txt_v0"
  | "jrmemo_txt_v0"
  | "past_txt_v0"
  | "dtld_txt_v0"
  | "bptn_txt_v0"
  | "poor_txt_v0"
  | "twl_slot_txt_v0";

export type NativeBinaryTimeLikeInferV0 = {
  artifactKind: NativeBinaryTimeLikeArtifactKindV0;
  timeLogSuffix: TimeLogSuffix | null;
};

export type NativeTextLogInferV0 = {
  artifactKind: NativeLogTextArtifactKindV0;
  timeLogSuffix: TimeLogSuffix | null;
};

function basename(filename: string): string {
  return filename.replace(/^.*[/\\]/, "").trim();
}

function suffixFromGroup(g1: string): TimeLogSuffix | null {
  const u = g1.toUpperCase();
  if (u === "KHJY" || u === "KTKN" || u === "KNJ" || u === "KTWZ") {
    return u;
  }
  return null;
}

/** When the buffer matches Time 120B V0 probe, classify binary row family from filename. */
export function inferNativeBinaryTimeLikeArtifactFromFilename(
  filename: string
): NativeBinaryTimeLikeInferV0 | null {
  const base = basename(filename);
  let m = /^Time(KHJY|KTKN|KNJ|KTWZ)\.log$/i.exec(base);
  if (m) {
    return { artifactKind: "time_binary_v0", timeLogSuffix: suffixFromGroup(m[1]!) };
  }
  m = /^Dtld(KHJY|KTKN|KNJ|KTWZ)\.log$/i.exec(base);
  if (m) {
    return { artifactKind: "dtld_binary_v0", timeLogSuffix: suffixFromGroup(m[1]!) };
  }
  m = /^Bptn(KHJY|KTKN|KNJ|KTWZ)\.log$/i.exec(base);
  if (m) {
    return { artifactKind: "bptn_binary_v0", timeLogSuffix: suffixFromGroup(m[1]!) };
  }
  m = /^Poor(KHJY|KTKN|KNJ|KTWZ)\.log$/i.exec(base);
  if (m) {
    return { artifactKind: "poor_binary_v0", timeLogSuffix: suffixFromGroup(m[1]!) };
  }
  return null;
}

/** Line-based text import targets (UTF-8 / Shift_JIS spike) from basename. */
export function inferNativeTextLogArtifactFromFilename(
  filename: string
): NativeTextLogInferV0 | null {
  const base = basename(filename);
  if (/^past\.log$/i.test(base)) {
    return { artifactKind: "past_txt_v0", timeLogSuffix: null };
  }
  if (/^boot\.txt$/i.test(base)) {
    return { artifactKind: "boot_txt_v0", timeLogSuffix: null };
  }
  if (/^jrmemo\.txt$/i.test(base)) {
    return { artifactKind: "jrmemo_txt_v0", timeLogSuffix: null };
  }
  let m = /^Dtld(KHJY|KTKN|KNJ|KTWZ)\.log$/i.exec(base);
  if (m) {
    return { artifactKind: "dtld_txt_v0", timeLogSuffix: suffixFromGroup(m[1]!) };
  }
  m = /^Bptn(KHJY|KTKN|KNJ|KTWZ)\.log$/i.exec(base);
  if (m) {
    return { artifactKind: "bptn_txt_v0", timeLogSuffix: suffixFromGroup(m[1]!) };
  }
  m = /^Poor(KHJY|KTKN|KNJ|KTWZ)\.log$/i.exec(base);
  if (m) {
    return { artifactKind: "poor_txt_v0", timeLogSuffix: suffixFromGroup(m[1]!) };
  }
  if (/\.twl$/i.test(base)) {
    return { artifactKind: "twl_slot_txt_v0", timeLogSuffix: null };
  }
  return null;
}
