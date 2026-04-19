/**
 * Binary layout for native `TimeKHJY.log` (VB `Put`-style), V0 — see
 * docs/re/analysis/09-time-khjy-binary-layout-v0.md
 *
 * One logical record is **120 bytes**: 70-byte header block + 50-byte trailer block.
 */

const FLOAT32_COUNT = 9;
const RECORD_STRIDE = 120;
const PART_A_BYTES = 70;
const MAX_STRING_LEN = 4096;

/** `HH:MM:SS` style clock (observed). */
const TIME_HEAD_RE = /^\d{1,2}:\d{2}:\d{2}$/;

function readAsciiLenPrefix(
  dv: DataView,
  u8: Uint8Array,
  o: number
): { str: string; next: number } | null {
  if (o + 2 > u8.length) return null;
  const len = dv.getUint16(o, true);
  o += 2;
  if (len < 0 || len > MAX_STRING_LEN) return null;
  if (o + len > u8.length) return null;
  const str = new TextDecoder("windows-1252").decode(u8.subarray(o, o + len));
  return { str, next: o + len };
}

function readAsciiLenPrefixAllowTrunc(
  dv: DataView,
  u8: Uint8Array,
  o: number
): { str: string; next: number; truncated: boolean } | null {
  if (o + 2 > u8.length) return null;
  const len = dv.getUint16(o, true);
  o += 2;
  if (len < 0 || len > MAX_STRING_LEN) return null;
  if (o > u8.length) return null;
  if (o + len > u8.length) {
    const str = new TextDecoder("windows-1252").decode(u8.subarray(o, u8.length));
    return { str, next: u8.length, truncated: true };
  }
  const str = new TextDecoder("windows-1252").decode(u8.subarray(o, o + len));
  return { str, next: o + len, truncated: false };
}

function readNineFloat32(dv: DataView, o: number): { floats: number[]; next: number } | null {
  if (o + FLOAT32_COUNT * 4 > dv.byteLength) return null;
  const floats: number[] = [];
  for (let i = 0; i < FLOAT32_COUNT; i++) {
    floats.push(dv.getFloat32(o, true));
    o += 4;
  }
  return { floats, next: o };
}

export type TimeKHJYBinaryRecordV0 = {
  timeAscii: string;
  floats1: readonly number[];
  int32: number;
  dateAscii: string;
  /** Second clock column in the first 70 bytes (`HH:MM:SS`). */
  clockAscii: string;
  floats2: readonly number[];
  int322: number;
  dateAscii2: string;
  /** `true` if EOF cut the 120-byte block (or part A clock string). */
  truncated: boolean;
  /** Start + 120 when complete; otherwise buffer length. */
  nextOffset: number;
};

/**
 * Reads one **120-byte** record at `start`, or a prefix when the buffer is shorter
 * (still returns part A fields when possible).
 */
export function parseTimeKHJYBinaryRecordV0(
  u8: Uint8Array,
  start = 0
): TimeKHJYBinaryRecordV0 | null {
  if (start >= u8.length) return null;
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  let o = start;

  const head = readAsciiLenPrefix(dv, u8, o);
  if (!head) return null;
  o = head.next;
  if (!TIME_HEAD_RE.test(head.str)) return null;

  const f1 = readNineFloat32(dv, o);
  if (!f1) return null;
  o = f1.next;

  if (o + 4 > u8.length) return null;
  const int32 = dv.getInt32(o, true);
  o += 4;

  const dateBlk = readAsciiLenPrefix(dv, u8, o);
  if (!dateBlk) return null;
  o = dateBlk.next;

  const clockBlk = readAsciiLenPrefixAllowTrunc(dv, u8, o);
  if (!clockBlk) return null;
  o = clockBlk.next;
  const partATrunc = clockBlk.truncated;
  const oAfterA = start + PART_A_BYTES;
  if (!partATrunc && o !== oAfterA) return null;

  const floats2: number[] = [];
  let int322 = 0;
  let dateAscii2 = "";
  let truncated = partATrunc;
  let nextOffset = o;

  if (!partATrunc && start + RECORD_STRIDE <= u8.length) {
    const f2 = readNineFloat32(dv, o);
    if (!f2) return null;
    o = f2.next;
    floats2.push(...f2.floats);

    if (o + 4 > u8.length) return null;
    int322 = dv.getInt32(o, true);
    o += 4;

    const d2 = readAsciiLenPrefix(dv, u8, o);
    if (!d2) return null;
    o = d2.next;
    dateAscii2 = d2.str;

    if (o !== start + RECORD_STRIDE) return null;
    nextOffset = start + RECORD_STRIDE;
    truncated = false;
  } else if (!partATrunc && start + RECORD_STRIDE > u8.length) {
    truncated = true;
    nextOffset = u8.length;
  }

  return {
    timeAscii: head.str,
    floats1: f1.floats,
    int32,
    dateAscii: dateBlk.str,
    clockAscii: clockBlk.str,
    floats2,
    int322,
    dateAscii2,
    truncated,
    nextOffset,
  };
}

export function parseTimeKHJYLogFileV0(u8: Uint8Array): TimeKHJYBinaryRecordV0[] {
  const out: TimeKHJYBinaryRecordV0[] = [];
  let o = 0;
  while (o < u8.length) {
    const rec = parseTimeKHJYBinaryRecordV0(u8, o);
    if (!rec) break;
    out.push(rec);
    if (rec.truncated || rec.nextOffset <= o) break;
    o = rec.nextOffset;
  }
  return out;
}

export function looksLikeTimeKHJYBinaryV0(u8: Uint8Array): boolean {
  return parseTimeKHJYBinaryRecordV0(u8, 0) != null;
}
