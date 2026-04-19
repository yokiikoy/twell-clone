import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  looksLikeTimeKHJYBinaryV0,
  parseTimeKHJYBinaryRecordV0,
  parseTimeKHJYLogFileV0,
} from "./timeKHJYLogBinaryV0.js";

const twelljrDir = dirname(fileURLToPath(import.meta.url));

function buildRecord120(opts: {
  time: string;
  floats1: number[];
  int1: number;
  date1: string;
  clock: string;
  floats2: number[];
  int2: number;
  date2: string;
}): Uint8Array {
  const parts: number[] = [];
  const pushU16 = (n: number) => {
    parts.push(n & 0xff, (n >> 8) & 0xff);
  };
  const pushStr = (s: string) => {
    const b = Buffer.from(s, "latin1");
    pushU16(b.length);
    for (const x of b) parts.push(x);
  };
  const dv = new DataView(new ArrayBuffer(4));
  const pushF32 = (x: number) => {
    dv.setFloat32(0, x, true);
    for (let i = 0; i < 4; i++) parts.push(dv.getUint8(i));
  };
  pushStr(opts.time);
  for (const x of opts.floats1) pushF32(x);
  parts.push(opts.int1 & 0xff, (opts.int1 >> 8) & 0xff, (opts.int1 >> 16) & 0xff, (opts.int1 >> 24) & 0xff);
  pushStr(opts.date1);
  pushStr(opts.clock);
  for (const x of opts.floats2) pushF32(x);
  parts.push(opts.int2 & 0xff, (opts.int2 >> 8) & 0xff, (opts.int2 >> 16) & 0xff, (opts.int2 >> 24) & 0xff);
  pushStr(opts.date2);
  if (parts.length !== 120) {
    throw new Error(`expected 120 bytes, got ${parts.length}`);
  }
  return Uint8Array.from(parts);
}

describe("parseTimeKHJYBinaryRecordV0", () => {
  it("parses real 64-byte head fixture (truncated part A clock)", () => {
    const path = join(twelljrDir, "../../fixtures/timelog-native/timekhjy-head-64.bin");
    const u8 = readFileSync(path);
    const rec = parseTimeKHJYBinaryRecordV0(u8, 0);
    expect(rec).not.toBeNull();
    expect(rec!.timeAscii).toBe("17:28:32");
    expect(rec!.floats1).toHaveLength(9);
    expect(rec!.floats1[0]).toBeCloseTo(25.163, 2);
    expect(rec!.int32).toBe(10);
    expect(rec!.dateAscii).toBe("17.03.20");
    expect(rec!.truncated).toBe(true);
    expect(rec!.clockAscii).toBe("22");
    expect(rec!.floats2).toHaveLength(0);
    expect(rec!.nextOffset).toBe(64);
    expect(looksLikeTimeKHJYBinaryV0(u8)).toBe(true);
  });

  it("parses a synthetic full 120-byte record", () => {
    const floats1 = Array.from({ length: 9 }, (_, i) => i + 0.25);
    const floats2 = Array.from({ length: 9 }, (_, i) => i + 10.25);
    const u8 = buildRecord120({
      time: "12:00:00",
      floats1,
      int1: 7,
      date1: "01.02.03",
      clock: "11:11:11",
      floats2,
      int2: 8,
      date2: "04.05.06",
    });
    const rec = parseTimeKHJYBinaryRecordV0(u8, 0);
    expect(rec!.truncated).toBe(false);
    expect(rec!.clockAscii).toBe("11:11:11");
    expect(rec!.floats2).toHaveLength(9);
    expect(rec!.int322).toBe(8);
    expect(rec!.dateAscii2).toBe("04.05.06");
    expect(rec!.nextOffset).toBe(120);
    const all = parseTimeKHJYLogFileV0(u8);
    expect(all).toHaveLength(1);
  });

  it("parses two concatenated 120-byte records", () => {
    const a = buildRecord120({
      time: "01:02:03",
      floats1: Array(9).fill(1),
      int1: 1,
      date1: "01.01.01",
      clock: "02:02:02",
      floats2: Array(9).fill(2),
      int2: 2,
      date2: "03.03.03",
    });
    const b = buildRecord120({
      time: "03:04:05",
      floats1: Array(9).fill(3),
      int1: 4,
      date1: "05.05.05",
      clock: "06:06:06",
      floats2: Array(9).fill(4),
      int2: 5,
      date2: "07.07.07",
    });
    const u8 = new Uint8Array(240);
    u8.set(a, 0);
    u8.set(b, 120);
    const all = parseTimeKHJYLogFileV0(u8);
    expect(all).toHaveLength(2);
    expect(all[1]!.timeAscii).toBe("03:04:05");
  });
});
