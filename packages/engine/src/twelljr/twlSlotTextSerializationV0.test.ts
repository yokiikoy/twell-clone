import { describe, expect, it } from "vitest";
import {
  formatUint8HeadHexV0,
  looksLikeTwlSlotTextSerializationV0,
} from "./twlSlotTextSerializationV0.js";

describe("twlSlotTextSerializationV0", () => {
  it("detects VB-style CRLF slot text (ComJR-style head)", () => {
    const head =
      '""\r\n#FALSE#\r\n0\r\n1560\r\n14280\r\n#FALSE#\r\n#TRUE#\r\n#FALSE#\r\n';
    const u8 = new TextEncoder().encode(head.repeat(4));
    expect(looksLikeTwlSlotTextSerializationV0(u8)).toBe(true);
  });

  it("rejects buffers without VB bool markers", () => {
    const u8 = new TextEncoder().encode("hello\nworld\n".repeat(20));
    expect(looksLikeTwlSlotTextSerializationV0(u8)).toBe(false);
  });

  it("rejects NUL-heavy binary", () => {
    const u8 = new Uint8Array(200);
    u8[0] = 0x23;
    u8[1] = 0x46;
    expect(looksLikeTwlSlotTextSerializationV0(u8)).toBe(false);
  });

  it("formatUint8HeadHexV0 groups 16 bytes per line", () => {
    const u8 = new Uint8Array(20);
    for (let i = 0; i < 20; i++) u8[i] = i;
    expect(formatUint8HeadHexV0(u8, 20)).toBe(
      "00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f\n10 11 12 13"
    );
  });
});
