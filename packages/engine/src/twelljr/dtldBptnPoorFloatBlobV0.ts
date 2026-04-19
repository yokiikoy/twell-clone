/**
 * Native `Dtld*.log` / `Bptn*.log` / `Poor*.log` packed floats (TWJR216 V0).
 *
 * - **Dtld**: 6-byte triplets `(u16=1, u16=0x01??, u16)` encoding two ASCII letters per triplet,
 *   then `float32` LE payload; trailing `0..3` bytes observed (file length not always 4-aligned).
 * - **Bptn / Poor**: entire file is `float32` LE (`byteLength % 4 === 0`).
 */

import type { TimeLogSuffix } from "./logContracts.js";

export type NativeFloatBlobArtifactKindV0 =
  | "dtld_float32_blob_v0"
  | "bptn_float32_blob_v0"
  | "poor_float32_blob_v0";

export type NativeFloatBlobInferV0 = {
  artifactKind: NativeFloatBlobArtifactKindV0;
  timeLogSuffix: TimeLogSuffix | null;
};

export type DtldPackedNativeParseV0 = {
  headerLabel: string;
  headerByteLength: number;
  floats: Float32Array;
  trailerByteLength: number;
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

/** Filename → float-blob artifact (independent of buffer probe). */
export function inferNativeFloatBlobArtifactFromFilename(
  filename: string
): NativeFloatBlobInferV0 | null {
  const base = basename(filename);
  let m = /^Dtld(KHJY|KTKN|KNJ|KTWZ)\.log$/i.exec(base);
  if (m) {
    return { artifactKind: "dtld_float32_blob_v0", timeLogSuffix: suffixFromGroup(m[1]!) };
  }
  m = /^Bptn(KHJY|KTKN|KNJ|KTWZ)\.log$/i.exec(base);
  if (m) {
    return { artifactKind: "bptn_float32_blob_v0", timeLogSuffix: suffixFromGroup(m[1]!) };
  }
  m = /^Poor(KHJY|KTKN|KNJ|KTWZ)\.log$/i.exec(base);
  if (m) {
    return { artifactKind: "poor_float32_blob_v0", timeLogSuffix: suffixFromGroup(m[1]!) };
  }
  return null;
}

/**
 * Parse Dtld triplet header; stops at first `u16` at current offset that is not `1`
 * (float payload starts at that offset — first float often begins with `00 00`).
 */
export function parseDtldTripletHeaderByteLengthV0(u8: Uint8Array): {
  label: string;
  headerByteLength: number;
} | null {
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  let i = 0;
  let label = "";
  while (i + 6 <= u8.length) {
    const a = dv.getUint16(i, true);
    if (a !== 1) break;
    const x = dv.getUint16(i + 2, true);
    const y = dv.getUint16(i + 4, true);
    if ((x >> 8) !== 1) break;
    const c1 = x & 0xff;
    const hiY = (y >> 8) & 0xff;
    const loY = y & 0xff;
    const c2 = hiY !== 0 ? hiY : loY;
    if (c1 < 0x20 || c1 > 0x7e || c2 < 0x20 || c2 > 0x7e) break;
    label += String.fromCharCode(c1, c2);
    i += 6;
  }
  if (label.length < 4 || i + 4 > u8.length) return null;
  return { label, headerByteLength: i };
}

export function parseDtldPackedNativeFileV0(u8: Uint8Array): DtldPackedNativeParseV0 | null {
  const head = parseDtldTripletHeaderByteLengthV0(u8);
  if (!head) return null;
  const tailBytes = u8.length - head.headerByteLength;
  const trailerLen = tailBytes & 3;
  const floatBytes = tailBytes - trailerLen;
  if (floatBytes < 4 || floatBytes % 4 !== 0) return null;
  const n = floatBytes >> 2;
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  const floats = new Float32Array(n);
  let o = head.headerByteLength;
  for (let i = 0; i < n; i++) {
    floats[i] = dv.getFloat32(o, true);
    o += 4;
  }
  return {
    headerLabel: head.label,
    headerByteLength: head.headerByteLength,
    floats,
    trailerByteLength: trailerLen,
  };
}

export function looksLikeDtldPackedNativeV0(u8: Uint8Array): boolean {
  const p = parseDtldPackedNativeFileV0(u8);
  if (!p || p.floats.length < 4) return false;
  const a = p.floats[0]!;
  const b = p.floats[1]!;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  if (a <= 0 || a > 200_000 || b <= 0 || b > 200_000) return false;
  return true;
}

/** Whole-file float32 LE (Bptn/Poor). */
export function parseNativeFloat32BlobFileV0(u8: Uint8Array): Float32Array | null {
  if (u8.length < 16 || u8.length % 4 !== 0) return null;
  const n = u8.length >> 2;
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = dv.getFloat32(i << 2, true);
  }
  return out;
}

export function looksLikeBptnPoorFloat32ScoresBlobV0(u8: Uint8Array): boolean {
  if (u8.length < 64 || u8.length % 4 !== 0) return false;
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  const probe = Math.min(u8.length >> 2, 1024);
  let ok = 0;
  for (let i = 0; i < probe; i++) {
    const v = dv.getFloat32(i << 2, true);
    if (!Number.isFinite(v)) return false;
    if (v >= -1e6 && v <= 1e6) ok++;
  }
  return ok / probe > 0.98;
}
