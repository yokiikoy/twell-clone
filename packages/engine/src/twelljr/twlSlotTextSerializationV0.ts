/**
 * Heavy-user slot files (`*.twl`) — TWJR216 `ComJR.twl` is **CRLF line text**
 * with VB-style `#FALSE#` / `#TRUE#` markers (not a fixed-width binary record).
 */

import { asciiHeavyTextRatioV0 } from "./nativeBufferTextHeuristicV0.js";
import { decodeNativeTextFileBestEffort } from "./nativeTextArtifactV0.js";

const VB_BOOL_MARKER_RE = /#(?:FALSE|TRUE)#/i;

/**
 * `true` when the buffer decodes like a serialized VB property-bag / slot dump
 * (enough ASCII structure + at least one `#FALSE#` / `#TRUE#` token).
 */
export function looksLikeTwlSlotTextSerializationV0(u8: Uint8Array): boolean {
  const sampleLen = Math.min(u8.length, 16_000);
  if (sampleLen < 8) return false;
  const slice = u8.subarray(0, sampleLen);
  let nul = 0;
  for (let i = 0; i < slice.length; i++) {
    if (slice[i] === 0) nul++;
  }
  if (nul / slice.length > 0.03) return false;

  const { text } = decodeNativeTextFileBestEffort(slice);
  if (!VB_BOOL_MARKER_RE.test(text)) return false;

  const repl = (text.match(/\uFFFD/g) ?? []).length;
  if (repl > 8 && repl / Math.max(text.length, 1) > 0.03) return false;

  const ratio = asciiHeavyTextRatioV0(text);
  return ratio >= 0.52;
}

/** Multi-line hex dump of the first `maxBytes` (default 64), 16 bytes per row. */
export function formatUint8HeadHexV0(u8: Uint8Array, maxBytes = 64): string {
  const n = Math.min(u8.length, maxBytes);
  const lines: string[] = [];
  for (let i = 0; i < n; i += 16) {
    const row = u8.subarray(i, Math.min(i + 16, n));
    lines.push(
      [...row].map((b) => b.toString(16).padStart(2, "0")).join(" ")
    );
  }
  return lines.join("\n");
}
