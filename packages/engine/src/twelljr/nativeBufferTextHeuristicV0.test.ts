import { describe, expect, it } from "vitest";
import { bufferLooksLikeLineOrientedTextLogV0 } from "./nativeBufferTextHeuristicV0.js";

describe("nativeBufferTextHeuristicV0", () => {
  it("accepts plain ASCII lines", () => {
    const u8 = new TextEncoder().encode("hello\nworld\nfoo\tbar\n");
    expect(bufferLooksLikeLineOrientedTextLogV0(u8)).toBe(true);
  });
  it("rejects null-heavy buffer", () => {
    const u8 = new Uint8Array(400);
    u8[0] = 0x41;
    expect(bufferLooksLikeLineOrientedTextLogV0(u8)).toBe(false);
  });
});
