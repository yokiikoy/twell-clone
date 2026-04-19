import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  looksLikePastLogBinaryV0,
  parsePastLogBinaryRecordV0,
  parsePastLogFileV0,
  pastLogDateDdMmYySortMs,
  PAST_LOG_RECORD_STRIDE_V0,
} from "./pastLogBinaryV0.js";

function syntheticThreeRecords(): Uint8Array {
  const dv = new DataView(new ArrayBuffer(150));
  const writeRec = (base: number, date: string, f: number, i32: number) => {
    let o = base;
    dv.setUint16(o, date.length, true);
    o += 2;
    for (let k = 0; k < date.length; k++) {
      dv.setUint8(o + k, date.charCodeAt(k) & 0xff);
    }
    o += date.length;
    dv.setFloat32(o, f, true);
    o += 4;
    dv.setUint16(o, 0, true);
    o += 2;
    dv.setInt32(o, i32, true);
    o += 4;
    while (o < base + PAST_LOG_RECORD_STRIDE_V0) {
      dv.setUint8(o, 0);
      o++;
    }
  };
  writeRec(0, "01.06.30", 1.25, 100);
  writeRec(50, "02.06.30", 2.5, 200);
  writeRec(100, "03.06.30", 3.75, 300);
  return new Uint8Array(dv.buffer);
}

describe("pastLogBinaryV0", () => {
  it("parses synthetic 50B records", () => {
    const u8 = syntheticThreeRecords();
    expect(looksLikePastLogBinaryV0(u8)).toBe(true);
    const all = parsePastLogFileV0(u8);
    expect(all).toHaveLength(3);
    expect(all[0]!.dateAscii).toBe("01.06.30");
    expect(all[0]!.valueF32).toBeCloseTo(1.25);
    expect(all[0]!.valueI32).toBe(100);
  });

  it("reads committed synthetic fixture", () => {
    const p = join(process.cwd(), "fixtures/timelog-native/past-v0-synthetic-150.bin");
    const u8 = new Uint8Array(readFileSync(p));
    expect(looksLikePastLogBinaryV0(u8)).toBe(true);
    expect(parsePastLogFileV0(u8)).toHaveLength(3);
  });

  it("sort key from DD.MM.YY", () => {
    expect(pastLogDateDdMmYySortMs("26.04.18")).toBe(Date.UTC(2018, 3, 26, 12, 0, 0));
    expect(pastLogDateDdMmYySortMs("26.04.99")).toBe(Date.UTC(1999, 3, 26, 12, 0, 0));
  });

  it("parsePastLogBinaryRecordV0 rejects bad date", () => {
    const u8 = new Uint8Array(PAST_LOG_RECORD_STRIDE_V0);
    u8[0] = 3;
    u8[1] = 0;
    u8[2] = 0x41;
    u8[3] = 0x42;
    u8[4] = 0x43;
    expect(parsePastLogBinaryRecordV0(u8, 0)).toBeNull();
  });
});
