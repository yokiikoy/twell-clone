import { describe, expect, it } from "vitest";
import {
  inferNativeFloatBlobArtifactFromFilename,
  looksLikeBptnPoorFloat32ScoresBlobV0,
  looksLikeDtldPackedNativeV0,
  parseDtldPackedNativeFileV0,
  parseNativeFloat32BlobFileV0,
} from "./dtldBptnPoorFloatBlobV0.js";

function encodeDtldTripletPair(c1: string, c2: string): Uint8Array {
  const o = new Uint8Array(6);
  const dv = new DataView(o.buffer);
  dv.setUint16(0, 1, true);
  dv.setUint16(2, 0x0100 | c1.charCodeAt(0)!, true);
  dv.setUint16(4, c2.charCodeAt(0)! << 8, true);
  return o;
}

function buildSyntheticDtldV0(label: string, floats: number[], trailerLen: number): Uint8Array {
  const chunks: Uint8Array[] = [];
  for (let i = 0; i < label.length; i += 2) {
    chunks.push(encodeDtldTripletPair(label[i]!, label[i + 1]!));
  }
  const header = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  let h = 0;
  for (const c of chunks) {
    header.set(c, h);
    h += c.length;
  }
  const fb = new Uint8Array(floats.length * 4);
  const dv = new DataView(fb.buffer);
  for (let i = 0; i < floats.length; i++) dv.setFloat32(i * 4, floats[i]!, true);
  const tail = new Uint8Array(trailerLen);
  const out = new Uint8Array(header.length + fb.length + tail.length);
  out.set(header, 0);
  out.set(fb, header.length);
  out.set(tail, header.length + fb.length);
  return out;
}

describe("dtldBptnPoorFloatBlobV0", () => {
  it("infers float blob kinds from basenames", () => {
    expect(inferNativeFloatBlobArtifactFromFilename("DtldKHJY.log")).toEqual({
      artifactKind: "dtld_float32_blob_v0",
      timeLogSuffix: "KHJY",
    });
    expect(inferNativeFloatBlobArtifactFromFilename("x/BptnKNJ.log")).toEqual({
      artifactKind: "bptn_float32_blob_v0",
      timeLogSuffix: "KNJ",
    });
    expect(inferNativeFloatBlobArtifactFromFilename("PoorKTWZ.log")).toEqual({
      artifactKind: "poor_float32_blob_v0",
      timeLogSuffix: "KTWZ",
    });
  });

  it("parses synthetic Dtld header + floats + trailer", () => {
    const u8 = buildSyntheticDtldV0("tunefast", [600, 72, 80, 8], 3);
    expect(looksLikeDtldPackedNativeV0(u8)).toBe(true);
    const p = parseDtldPackedNativeFileV0(u8);
    expect(p).not.toBeNull();
    expect(p!.headerLabel).toBe("tunefast");
    expect(p!.floats.length).toBe(4);
    expect(p!.floats[0]).toBe(600);
    expect(p!.trailerByteLength).toBe(3);
  });

  it("parses uniform float32 blob", () => {
    const buf = new ArrayBuffer(64);
    const dv = new DataView(buf);
    for (let i = 0; i < 16; i++) dv.setFloat32(i * 4, 0.01 * ((i % 8) + 1), true);
    const u8 = new Uint8Array(buf);
    expect(looksLikeBptnPoorFloat32ScoresBlobV0(u8)).toBe(true);
    const f = parseNativeFloat32BlobFileV0(u8);
    expect(f?.length).toBe(16);
    expect(f![7]).toBeCloseTo(0.08, 5);
  });
});
