/**
 * Sort keys for merging native Time*.log binary rows with Web trial rows (wall-clock).
 */

export function parseNativeDateTimeUtcMs(
  dateAscii: string,
  timeAscii: string
): number | null {
  const d = dateAscii.trim();
  const t = timeAscii.trim();
  const dm = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(d);
  const tm = /^(\d{1,2}):(\d{2}):(\d{2})$/.exec(t);
  if (!dm || !tm) return null;
  const y = Number(dm[1]);
  const mo = Number(dm[2]);
  const day = Number(dm[3]);
  const hh = Number(tm[1]);
  const mm = Number(tm[2]);
  const ss = Number(tm[3]);
  if (
    [y, mo, day, hh, mm, ss].some((n) => !Number.isFinite(n)) ||
    mo < 1 ||
    mo > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }
  const ms = Date.UTC(y, mo - 1, day, hh, mm, ss);
  return Number.isFinite(ms) ? ms : null;
}

/** Primary row instant from first date + wall clock (for unified timeline sort). */
export function timeBinaryV0SortMs(dateAscii: string, timeAscii: string): number {
  return parseNativeDateTimeUtcMs(dateAscii, timeAscii) ?? 0;
}
