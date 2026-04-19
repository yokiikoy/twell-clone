import { describe, expect, it } from "vitest";
import {
  decodeNativeTextFileBestEffort,
  inferBootOrJrmemoArtifactKind,
  sortMsFromNativeTextLineV0,
  splitNativeTextLinesV0,
} from "./nativeTextArtifactV0.js";

describe("nativeTextArtifactV0", () => {
  it("infers Boot / JRmemo basenames", () => {
    expect(inferBootOrJrmemoArtifactKind("Boot.txt")).toBe("boot_txt_v0");
    expect(inferBootOrJrmemoArtifactKind("C:\\a\\BOOT.TXT")).toBe("boot_txt_v0");
    expect(inferBootOrJrmemoArtifactKind("JRmemo.txt")).toBe("jrmemo_txt_v0");
    expect(inferBootOrJrmemoArtifactKind("TimeKHJY.log")).toBeNull();
  });
  it("splits lines and skips empties", () => {
    expect(splitNativeTextLinesV0("a\n\nb\r\nc")).toEqual(["a", "b", "c"]);
  });
  it("sortMs uses embedded date when present", () => {
    const base = Date.UTC(2020, 0, 1);
    const ms = sortMsFromNativeTextLineV0("起動 2026/4/17 9:30:00 終了", base, 0);
    expect(ms).toBe(Date.UTC(2026, 3, 17, 9, 30, 0));
  });
  it("sortMs falls back to base + index", () => {
    const base = 1_700_000_000_000;
    expect(sortMsFromNativeTextLineV0("no date here", base, 3)).toBe(base + 3);
  });
  it("decode prefers utf-8 for ascii", () => {
    const enc = new TextEncoder();
    const { text, encodingLabel } = decodeNativeTextFileBestEffort(enc.encode("hello\n"));
    expect(encodingLabel).toBe("utf-8");
    expect(text).toBe("hello\n");
  });
});
