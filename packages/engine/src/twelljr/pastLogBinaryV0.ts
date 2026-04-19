/**
 * Native `Past.log` binary layout V0 — observed TWJR216: **50-byte fixed records**.
 *
 * Per record:
 * - `uint16` LE string length `L` (observed 8)
 * - `L` bytes **Windows-1252 / Latin-1** date text **`DD.MM.YY`** (day · month · 2-digit year)
 * - `float32` LE
 * - `uint16` LE (often 0, padding / flags)
 * - `int32` LE
 * - padding with `0x00` to `RECORD_STRIDE`
 */

export const PAST_LOG_RECORD_STRIDE_V0 = 50;

const DATE_DD_MM_YY = /^(\d{2})\.(\d{2})\.(\d{2})$/;

export type PastLogBinaryRecordV0 = {
  dateAscii: string;
  valueF32: number;
  valueI32: number;
  truncated: boolean;
  nextOffset: number;
};

/** Map `DD.MM.YY` to UTC noon sort key (YY→19xx if ≥70 else 20xx). */
export function pastLogDateDdMmYySortMs(dateAscii: string): number {
  const m = DATE_DD_MM_YY.exec(dateAscii.trim());
  if (!m) return 0;
  const dd = Number(m[1]);
  const mo = Number(m[2]);
  const yy = Number(m[3]);
  if (![dd, mo, yy].every((n) => Number.isFinite(n))) return 0;
  const y = yy >= 70 ? 1900 + yy : 2000 + yy;
  const ms = Date.UTC(y, mo - 1, dd, 12, 0, 0);
  return Number.isFinite(ms) ? ms : 0;
}

export function parsePastLogBinaryRecordV0(
  u8: Uint8Array,
  start = 0
): PastLogBinaryRecordV0 | null {
  if (start + PAST_LOG_RECORD_STRIDE_V0 > u8.length) return null;
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  let o = start;
  if (o + 2 > u8.length) return null;
  const strLen = dv.getUint16(o, true);
  o += 2;
  if (strLen < 1 || strLen > 32 || o + strLen > u8.length) return null;
  const dateAscii = new TextDecoder("windows-1252").decode(u8.subarray(o, o + strLen));
  o += strLen;
  if (!DATE_DD_MM_YY.test(dateAscii.trim())) return null;
  if (o + 4 > u8.length) return null;
  const valueF32 = dv.getFloat32(o, true);
  o += 4;
  if (o + 2 > u8.length) return null;
  o += 2; // uint16 gap (observed 0)
  if (o + 4 > u8.length) return null;
  const valueI32 = dv.getInt32(o, true);
  o += 4;
  const nextOffset = start + PAST_LOG_RECORD_STRIDE_V0;
  return {
    dateAscii,
    valueF32,
    valueI32,
    truncated: false,
    nextOffset,
  };
}

export function parsePastLogFileV0(u8: Uint8Array): PastLogBinaryRecordV0[] {
  const out: PastLogBinaryRecordV0[] = [];
  let o = 0;
  while (o + PAST_LOG_RECORD_STRIDE_V0 <= u8.length) {
    const rec = parsePastLogBinaryRecordV0(u8, o);
    if (!rec || rec.nextOffset <= o) break;
    out.push(rec);
    o = rec.nextOffset;
  }
  return out;
}

export function looksLikePastLogBinaryV0(u8: Uint8Array): boolean {
  return parsePastLogBinaryRecordV0(u8, 0) != null;
}
